import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from 'src/users/users.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookies first
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_ACCESS_SECRET') ||
        configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Only allow access tokens for authentication
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Add extra validation for payload integrity
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Add timestamp validation to prevent token reuse
    if (payload.iat && Date.now() / 1000 - payload.iat > 24 * 60 * 60) {
      throw new UnauthorizedException('Token too old');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Add extra user validation
    if (!user.id || user.id !== payload.sub) {
      throw new UnauthorizedException('Token user mismatch');
    }

    return user;
  }
}
