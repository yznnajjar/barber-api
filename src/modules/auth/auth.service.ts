import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResultDto, AuthTokensDto } from './dto/auth-response.dto';
import { AuthRepository } from './repositories/auth.repository';

/**
 * Holds all authentication business logic. Depends on the AuthRepository
 * abstraction for persistence and on JwtService for token signing — never
 * on Prisma directly (one exception: it reads the owner's salonId to embed
 * in the token, kept here to avoid a circular module import).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** Verify credentials, then issue a fresh access/refresh pair. */
  async login(email: string, password: string): Promise<AuthResultDto> {
    const user = await this.repo.findUserByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const salon = await this.prisma.salon.findUnique({ where: { ownerId: user.id } });
    const salonId = salon?.id ?? null;

    const tokens = await this.issueTokens(user, salonId);
    return {
      ...tokens,
      userId: user.id,
      email: user.email,
      role: user.role,
      salonId,
    };
  }

  /** Exchange a valid refresh token for a new pair (rotation). */
  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.repo.findValidRefreshToken(payload.sub);
    const match = await this.firstMatching(stored, refreshToken);
    if (!match) throw new UnauthorizedException('Refresh token revoked or expired');

    // Rotate: revoke the used token before issuing a new one.
    await this.repo.revokeRefreshToken(match.id);

    const user = await this.repo.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user, payload.salonId);
  }

  /** Revoke every refresh token for the user (logout everywhere). */
  async logout(userId: string): Promise<void> {
    await this.repo.revokeAllForUser(userId);
  }

  // --- private helpers -----------------------------------------------------

  private async issueTokens(user: User, salonId: string | null): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId,
    };

    // ttl values are validated at boot (Joi), so the non-null assertions are safe.
    // `expiresIn` accepts a number or an `ms`-style string ('900s', '7d'); cast
    // the plain string to satisfy the library's StringValue template type.
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret')!,
      expiresIn: this.config.get<string>('jwt.accessTtl')! as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret')!,
      expiresIn: this.config.get<string>('jwt.refreshTtl')! as JwtSignOptions['expiresIn'],
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.saveRefreshToken(user.id, tokenHash, expiresAt);

    return { accessToken, refreshToken };
  }

  private async firstMatching(
    stored: { id: string; tokenHash: string }[],
    raw: string,
  ): Promise<{ id: string } | null> {
    for (const row of stored) {
      if (await bcrypt.compare(raw, row.tokenHash)) return row;
    }
    return null;
  }
}
