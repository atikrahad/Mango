import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CommissionStatus, PayoutStatus } from '@mangosteen/database';

@Injectable()
export class AffiliateService {
  // In-memory click velocity map to track IP + UA fingerprints (15-second lockout TTL)
  private clickLockouts = new Map<string, number>();

  constructor(private prisma: PrismaService) {}

  async trackClick(body: any, ip: string, userAgent: string) {
    const { referralCode, referrerUrl } = body;

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { referralCode },
    });

    if (!affiliate || !affiliate.isActive) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'REFERRAL_EXPIRED',
          message: 'Referral link is invalid or expired.',
        },
      });
    }

    // Fingerprint generation based on IP + User-Agent + ReferralCode
    const fingerprint = `${ip}_${userAgent}_${referralCode}`;
    const now = Date.now();
    const lastClickTime = this.clickLockouts.get(fingerprint);

    if (lastClickTime && now - lastClickTime < 15000) {
      // Silently drop fraud velocity clicks, protecting payout limits
      return {
        success: true,
        message: 'Click registered (cached velocity filter active).',
        data: { referralCode, tracked: false },
      };
    }

    // Update velocity lockout
    this.clickLockouts.set(fingerprint, now);

    // Save click to database
    await this.prisma.referralClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ip,
        userAgent,
        referrerUrl,
      },
    });

    return {
      success: true,
      message: 'Click registered successfully.',
      data: { referralCode, tracked: true },
    };
  }

  async getAffiliateMe(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        clicks: {
          orderBy: { clickedAt: 'desc' },
          take: 10,
        },
        commissions: {
          include: {
            order: true,
          },
        },
        withdrawals: true,
      },
    });

    if (!affiliate) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Active affiliate profile not found.',
        },
      });
    }

    const clicksCount = await this.prisma.referralClick.count({
      where: { affiliateId: affiliate.id },
    });

    const pendingCommissions = affiliate.commissions
      .filter((c) => c.status === CommissionStatus.PENDING)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const approvedCommissions = affiliate.commissions
      .filter((c) => c.status === CommissionStatus.APPROVED)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      success: true,
      data: {
        id: affiliate.id,
        referralCode: affiliate.referralCode,
        walletBalance: Number(affiliate.walletBalance),
        clicksCount,
        pendingCommissions,
        approvedCommissions,
        clicks: affiliate.clicks,
        commissions: affiliate.commissions,
        withdrawals: affiliate.withdrawals,
      },
    };
  }

  async createWithdrawal(userId: string, body: any) {
    const { amount, method, paymentDetails } = body;

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate || !affiliate.isActive) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Active affiliate profile not found.',
        },
      });
    }

    const requestedAmount = Number(amount);
    if (requestedAmount < 500) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Minimum payout withdrawal request is 500 BDT.',
        },
      });
    }

    if (Number(affiliate.walletBalance) < requestedAmount) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Insufficient affiliate wallet balance.',
        },
      });
    }

    const withdraw = await this.prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.affiliate.update({
        where: { id: affiliate.id },
        data: { walletBalance: { decrement: requestedAmount } },
      });

      // Log request
      const request = await tx.withdrawRequest.create({
        data: {
          affiliateId: affiliate.id,
          amount: requestedAmount,
          status: PayoutStatus.PENDING,
          method,
          txRef: `WIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          notes: `Payout to ${method} accounts: ${paymentDetails}`,
        },
      });

      return request;
    });

    return {
      success: true,
      message: 'Withdrawal payout request submitted successfully.',
      data: withdraw,
    };
  }

  // Admin Queue Actions
  async getAdminWithdrawals() {
    const requests = await this.prisma.withdrawRequest.findMany({
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: requests,
    };
  }

  async updateWithdrawalStatus(id: string, body: any) {
    const { status, notes } = body; // APPROVED | REJECTED | PAID

    const request = await this.prisma.withdrawRequest.findUnique({
      where: { id },
      include: { affiliate: true },
    });

    if (!request) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Payout request record not found.',
        },
      });
    }

    if (request.status !== PayoutStatus.PENDING) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: 'Payout request is already processed.',
        },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If rejected, refund the wallet balance
      if (status === PayoutStatus.REJECTED) {
        await tx.affiliate.update({
          where: { id: request.affiliateId },
          data: { walletBalance: { increment: request.amount } },
        });
      }

      const requestUpdated = await tx.withdrawRequest.update({
        where: { id },
        data: {
          status,
          notes: notes || `Admin processed payout with status ${status}.`,
        },
      });

      return requestUpdated;
    });

    return {
      success: true,
      message: `Withdrawal request status updated to ${status}.`,
      data: updated,
    };
  }
}
