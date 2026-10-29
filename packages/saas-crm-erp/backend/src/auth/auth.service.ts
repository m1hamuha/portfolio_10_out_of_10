import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types';
import { RefreshToken } from './entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private createPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.organization_id,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password_hash', 'role', 'organization_id'],
    });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = this.createPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
      },
    };
  }

  private async createRefreshToken(userId: string): Promise<RefreshToken> {
    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const hashedToken = await bcrypt.hash(refreshTokenValue, 10);

    const refreshToken = this.refreshTokenRepository.create({
      token: hashedToken,
      user_id: userId,
      expires_at: expiresAt,
      is_revoked: false,
    });

    const savedToken = await this.refreshTokenRepository.save(refreshToken);

    return {
      ...savedToken,
      token: refreshTokenValue,
    };
  }

  async refreshToken(refreshTokenValue: string) {
    const hashedTokens = await this.refreshTokenRepository.find({
      where: { user_id: undefined as any },
      order: { created_at: 'DESC' },
      take: 10,
    });

    let validToken: RefreshToken | null = null;
    for (const storedToken of hashedTokens) {
      const isValid = await bcrypt.compare(
        refreshTokenValue,
        storedToken.token,
      );
      if (
        isValid &&
        !storedToken.is_revoked &&
        storedToken.expires_at > new Date()
      ) {
        validToken = storedToken;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.update(validToken.id, {
      is_revoked: true,
      revoked_at: new Date(),
    });

    const user = await this.usersRepository.findOne({
      where: { id: validToken.user_id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = this.createPayload(user);
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.createRefreshToken(user.id);

    this.logger.log(
      `Refresh token rotated for user ${user.id}. Previous token revoked.`,
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken.token,
    };
  }

  async revokeRefreshToken(refreshTokenValue: string): Promise<void> {
    const hashedTokens = await this.refreshTokenRepository.find({
      where: { user_id: undefined as any },
      order: { created_at: 'DESC' },
      take: 10,
    });

    for (const storedToken of hashedTokens) {
      const isValid = await bcrypt.compare(
        refreshTokenValue,
        storedToken.token,
      );
      if (isValid) {
        await this.refreshTokenRepository.update(storedToken.id, {
          is_revoked: true,
          revoked_at: new Date(),
        });
        return;
      }
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId as any, is_revoked: false },
      { is_revoked: true, revoked_at: new Date() },
    );
    this.logger.log(`All refresh tokens revoked for user ${userId}`);
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    const deletedCount = result.affected || 0;
    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} expired refresh tokens`);
    }
    return deletedCount;
  }
}
