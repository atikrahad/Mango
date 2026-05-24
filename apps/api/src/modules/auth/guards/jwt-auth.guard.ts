import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'No authorization header provided.',
        },
      });
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Malformed authorization token.',
        },
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'access_secret_123',
      });
      (request as any).user = payload;
      return true;
    } catch (e: any) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'JWT access token expired or invalid.',
          details: [e.message],
        },
      });
    }
  }
}
