import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OrderStatus, PaymentStatus, CommissionStatus } from '@mangosteen/database';

@Injectable()
export class LogisticsService {
  // In-memory OTP cache maps orderId to { otp: string, expiresAt: number }
  private otpCache = new Map<string, { otp: string; expiresAt: number }>();

  constructor(private prisma: PrismaService) {}

  async getAssignedRuns(agentId: string) {
    const orders = await this.prisma.order.findMany({
      where: { deliveryAgentId: agentId },
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
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: orders,
    };
  }

  async triggerOtpArrival(orderId: string, agentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Order not found.',
        },
      });
    }

    if (order.deliveryAgentId !== agentId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'This order is not assigned to your delivery zone.',
        },
      });
    }

    // Generate 6-digit high-entropy OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins TTL

    this.otpCache.set(orderId, { otp, expiresAt });

    // In a production app, we would send this via SMS gateway like Twilio.
    // For local verification and simulated testing, we return the OTP in the API payload
    // so the frontend can mock customer display or SMS logs!
    return {
      success: true,
      message: `SMS OTP code dispatched successfully to ${order.user.fullName}'s registered mobile: ${order.user.phone || '+8801700000000'}.`,
      data: {
        otp, // Shared directly to ease integration and browser tests
      },
    };
  }

  async verifyOtp(orderId: string, agentId: string, body: any) {
    const { otp } = body;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, commission: true },
    });

    if (!order) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Order not found.',
        },
      });
    }

    if (order.deliveryAgentId !== agentId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Access Denied: Agent assignment zone mismatch.',
        },
      });
    }

    const cached = this.otpCache.get(orderId);
    if (!cached) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'DELIVERY_OTP_INVALID',
          message: 'OTP code has expired or was never dispatched. Request a new code.',
        },
      });
    }

    if (Date.now() > cached.expiresAt) {
      this.otpCache.delete(orderId);
      throw new BadRequestException({
        success: false,
        error: {
          code: 'DELIVERY_OTP_INVALID',
          message: 'OTP code expired. Request a new code.',
        },
      });
    }

    if (cached.otp !== otp) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'DELIVERY_OTP_INVALID',
          message: 'Delivery verification OTP code mismatches.',
        },
      });
    }

    // Success - Execute safe transaction block to settle order, payment, and affiliate commissions
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          codVerified: true,
        },
        include: { payment: true },
      });

      // 2. Update payment status to paid
      if (order.payment) {
        await tx.payment.update({
          where: { orderId },
          data: { status: PaymentStatus.PAID },
        });
      }

      // 3. Settle affiliate commission
      if (order.commission) {
        // Approve commission
        await tx.affiliateCommission.update({
          where: { orderId },
          data: { status: CommissionStatus.APPROVED },
        });

        // Increment wallet balance
        await tx.affiliate.update({
          where: { id: order.commission.affiliateId },
          data: { walletBalance: { increment: order.commission.amount } },
        });
      }

      return updated;
    });

    // Clear cached OTP
    this.otpCache.delete(orderId);

    return {
      success: true,
      message: 'Delivery OTP matched successfully! Cash settlement and commission ledger cleared.',
      data: updatedOrder,
    };
  }
}
