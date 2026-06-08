import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { UserRole } from '@mangosteen/database';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(body: any) {
    const { email, password, fullName, phone, role } = body;

    // Strict validation: Only AFFILIATE in self-registration
    if (role !== UserRole.AFFILIATE) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Can only register as AFFILIATE.',
        },
      });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, phone ? { phone } : {}].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Email or phone number is already registered.',
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          fullName,
          phone,
          passwordHash,
          role,
          isActive: true,
          isVerified: false, // Affiliates require admin verification
        },
      });

      const referralCode = `aff_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await tx.affiliate.create({
        data: {
          userId: newUser.id,
          referralCode,
          walletBalance: 0,
          isActive: true,
        },
      });

      return newUser;
    });

    return {
      success: true,
      message: 'Affiliate registration successful. Wait for identity verification.',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(body: any, response: Response) {
    const { email, password } = body;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { affiliateProfile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid credentials or inactive account.',
        },
      });
    }

    const matches = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!matches) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid credentials.',
        },
      });
    }

    const tokens = await this.generateTokens(user);
    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return this.formatLoginResponse(user, tokens.accessToken);
  }

  async refresh(refreshToken: string, response: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'No refresh token cookie found.',
        },
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_123',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { affiliateProfile: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'AUTH_FORBIDDEN',
            message: 'User no longer exists or is inactive.',
          },
        });
      }

      // Rotate token pair
      const tokens = await this.generateTokens(user);
      this.setRefreshTokenCookie(response, tokens.refreshToken);

      return this.formatLoginResponse(user, tokens.accessToken);
    } catch (e) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Refresh token has expired or is invalid.',
        },
      });
    }
  }

  async logout(response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
    });
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access_secret_123',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_123',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private setRefreshTokenCookie(response: Response, token: string) {
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth/refresh', // only sent to refresh endpoint
    });
  }

  private formatLoginResponse(user: any, accessToken: string) {
    return {
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          referralCode: user.affiliateProfile?.referralCode,
        },
      },
    };
  }
}
