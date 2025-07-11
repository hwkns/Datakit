import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    // Generate a secure random token
    const tokenData = {
      sub: userId,
      type: 'refresh',
      jti: crypto.randomUUID(), // Unique token ID
      iat: Math.floor(Date.now() / 1000),
    };

    const refreshToken = this.jwtService.sign(tokenData, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Store in database
    const tokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(tokenEntity);
    return refreshToken;
  }

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    try {
      // Verify JWT signature and expiration
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if token exists in database and is not revoked
      const tokenEntity = await this.refreshTokenRepository.findOne({
        where: {
          token,
          isRevoked: false,
        },
        relations: ['user'],
      });

      // Additional check for expiration
      if (tokenEntity && tokenEntity.expiresAt < new Date()) {
        return null; // Token is expired
      }

      if (!tokenEntity) {
        return null;
      }

      // Since user is lazy, we need to explicitly load it
      if (
        tokenEntity.user &&
        typeof (tokenEntity.user as any).then === 'function'
      ) {
        tokenEntity.user = await (tokenEntity.user as any);
      }

      return tokenEntity;
    } catch (error) {
      return null;
    }
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async rotateRefreshToken(
    oldToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string | null> {
    const tokenEntity = await this.validateRefreshToken(oldToken);

    if (!tokenEntity) {
      return null;
    }

    // Revoke old token
    await this.revokeToken(oldToken);

    // Generate new token
    return this.generateRefreshToken(tokenEntity.userId, ipAddress, userAgent);
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
