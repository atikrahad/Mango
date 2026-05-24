import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(body, response);
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Note: express cookie-parser must be registered in main.ts to populate req.cookies
    const refreshToken = request.cookies?.['refresh_token'];
    return this.authService.refresh(refreshToken, response);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: any) {
    return {
      success: true,
      data: {
        user: request.user,
      },
    };
  }
}
