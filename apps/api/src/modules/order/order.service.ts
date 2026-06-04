import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStatus, PaymentStatus, CommissionStatus } from '@mangosteen/database';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) { }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: orders,
    };
  }

  async checkout(body: any) {
    const {
      items,
      shippingAddress,
      district,
      deliverySlot,
      paymentGateway,
      couponCode,
      referralCode,
      customerName,
      customerPhone,
      customerEmail,
    } = body;

    if (!items || items.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Order items basket cannot be empty.',
        },
      });
    }

    // Run order processing inside SQLite transaction
    const orderResult = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalCommission = 0;
      const orderItemsToCreate: any[] = [];

      // 1. Process items and lock inventory
      for (const item of items) {
        const { variantId, quantity } = item;
        const requestedQuantity = Number(quantity);

        // Retrieve inventory record
        const stock = await tx.inventory.findUnique({
          where: { variantId },
        });

        if (!stock) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'STOCK_INSUFFICIENT',
              message: `Inventory record for variant ID ${variantId} not found.`,
            },
          });
        }
        if (stock.availableStock < requestedQuantity) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'STOCK_INSUFFICIENT',
              message: `Requested mango weight exceeds available stock. Only ${stock.availableStock} units remaining.`,
              details: [`Requested: ${requestedQuantity}. Remaining: ${stock.availableStock}`],
            },
          });
        }

        // Fetch variant price and associated product (for commission rate)
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'STOCK_INSUFFICIENT',
              message: 'Product variant not found.',
            },
          });
        }

        // Decrement stock
        await tx.inventory.update({
          where: { variantId },
          data: {
            availableStock: { decrement: requestedQuantity },
          },
        });

        const price = Number(variant.price) - Number(variant.discount);
        subtotal += price * requestedQuantity;

        // Calculate item commission based on product's commissionPercentage setting
        const commissionPct = Number(variant.product.commissionPercentage || 5.0);
        const itemCommission = price * requestedQuantity * (commissionPct / 100);
        totalCommission += itemCommission;

        orderItemsToCreate.push({
          variantId,
          quantity: requestedQuantity,
          price,
        });
      }

      // 2. Shipping calculations
      const shippingZone = await tx.deliveryZone.findFirst({
        where: { district: district, isActive: true },
      });
      const shippingCost = shippingZone ? Number(shippingZone.baseCharge) : 120.0;

      // 3. Coupon deductions
      let discountApplied = 0;
      if (couponCode) {
        const coupon = await tx.coupon.findFirst({
          where: { code: couponCode, isActive: true, expiryDate: { gt: new Date() } },
        });

        if (!coupon || coupon.usedCount >= coupon.usageLimit) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'COUPON_INVALID',
              message: 'Promo coupon code is invalid, expired, or fully utilized.',
            },
          });
        }

        if (subtotal < Number(coupon.minCartValue)) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'COUPON_INVALID',
              message: `Minimum cart value of ${coupon.minCartValue} BDT required to use coupon.`,
            },
          });
        }

        if (Number(coupon.discountPct) > 0) {
          discountApplied = subtotal * (Number(coupon.discountPct) / 100);
        } else {
          discountApplied = Number(coupon.discountAmount);
        }

        // Limit discount to subtotal
        if (discountApplied > subtotal) {
          discountApplied = subtotal;
        }

        // Update coupon usage
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const totalAmount = subtotal - discountApplied + shippingCost;

      // 4. Create Order
      const newOrder = await tx.order.create({
        data: {
          status: OrderStatus.PENDING,
          totalAmount,
          shippingCost,
          discountApplied,
          shippingAddress,
          district,
          deliverySlot,
          deliveryZoneId: shippingZone?.id || null,
          customerName,
          customerPhone,
          customerEmail,
          referralCode,
        },
      });

      // Create order items relations
      for (const oItem of orderItemsToCreate) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: oItem.variantId,
            quantity: oItem.quantity,
            price: oItem.price,
          },
        });
      }

      // 5. Create Payment
      const paymentStatus = paymentGateway === 'COD' ? PaymentStatus.PENDING : PaymentStatus.PAID; // Online paid automatically
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          status: paymentStatus,
          gateway: paymentGateway,
          gatewayTxId: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          amount: totalAmount,
        },
      });

      // 6. Manage Affiliate Attribution
      if (referralCode && totalCommission > 0) {
        const affiliate = await tx.affiliate.findUnique({
          where: { referralCode, isActive: true },
        });

        if (affiliate) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: affiliate.id,
              orderId: newOrder.id,
              amount: totalCommission,
              status: CommissionStatus.PENDING,
              notes: `Commission calculated from product rates for order: ${newOrder.id}`,
            },
          });
        }
      }

      return newOrder;
    });

    return {
      success: true,
      message: 'Checkout checkout purchase submitted successfully.',
      data: orderResult,
    };
  }

  // Admin Dashboard Actions
  async getAdminOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payment: true,
        deliveryAgent: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: orders,
    };
  }

  async updateOrderStatus(id: string, body: any) {
    const { status, deliveryAgentId } = body;

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payment: true, commission: true },
    });

    if (!order) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Order record not found.',
        },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateData: any = { status };

      if (deliveryAgentId) {
        updateData.deliveryAgentId = deliveryAgentId;
      }

      // If transition to DELIVERED (and not COD which is handled via secure logistics OTP)
      if (status === OrderStatus.DELIVERED && order.payment?.gateway !== 'COD') {
        // Approve affiliate commission immediately if exist
        if (order.commission) {
          await tx.affiliateCommission.update({
            where: { orderId: id },
            data: { status: CommissionStatus.APPROVED },
          });

          // Add to wallet balance
          await tx.affiliate.update({
            where: { id: order.commission.affiliateId },
            data: { walletBalance: { increment: order.commission.amount } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: updateData,
      });
    });

    return {
      success: true,
      message: `Order status updated successfully to ${status}.`,
      data: updated,
    };
  }

  async getDeliveryRiders() {
    const riders = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });
    return {
      success: true,
      data: riders,
    };
  }
}
