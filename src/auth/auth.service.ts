import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';
import type { SafeUser, UserPayload, TokenPair } from './interfaces/user.interface';

/** Number of bcrypt salt rounds */
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ================================
  // REGISTER — POST /auth/register
  // ================================
  async register(dto: RegisterDto): Promise<SafeUser> {
    // 1. Check duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // 3. Persist user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    // 4. Return without password
    return this.toSafeUser(user);
  }

  // ================================
  // LOGIN — POST /auth/login
  // ================================
  async login(dto: LoginDto): Promise<TokenPair & { user: SafeUser }> {
    // 1. Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Issue token pair
    const tokens = await this.generateTokenPair(user.id, user.email, user.name);

    return { ...tokens, user: this.toSafeUser(user) };
  }

  // ================================
  // REFRESH — POST /auth/refresh
  // ================================
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    // 1. Verify JWT signature & expiry
    let payload: UserPayload;
    try {
      payload = await this.jwtService.verifyAsync<UserPayload>(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Hash the incoming token to compare against stored hash
    const hashedIncoming = await bcrypt.hash(rawRefreshToken, SALT_ROUNDS);

    // Find all refresh tokens for this user and compare
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, expiresAt: { gt: new Date() } },
    });

    let matchedToken: (typeof storedTokens)[0] | undefined;
    for (const stored of storedTokens) {
      const matches = await bcrypt.compare(rawRefreshToken, stored.token);
      if (matches) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // 3. Rotate: delete old token
    await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });

    // 4. Issue new token pair
    return this.generateTokenPair(payload.sub, payload.email, payload.name);
  }

  // ================================
  // LOGOUT — POST /auth/logout
  // ================================
  async logout(rawRefreshToken: string): Promise<void> {
    let payload: UserPayload;
    try {
      payload = await this.jwtService.verifyAsync<UserPayload>(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      // Token expired or malformed — still try best-effort cleanup
      return;
    }

    // Find all active tokens for user and remove matching one
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub },
    });

    for (const stored of storedTokens) {
      const matches = await bcrypt.compare(rawRefreshToken, stored.token);
      if (matches) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        break;
      }
    }
  }

  // ================================
  // GET PROFILE — GET /auth/profile
  // ================================
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSafeUser(user);
  }

  // ================================
  // UPDATE PROFILE — PATCH /auth/profile
  // ================================
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    // 1. Check user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check email conflict
    if (dto.email && dto.email !== user.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException('Email is already taken');
      }
    }

    // 3. Update
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
    });

    return this.toSafeUser(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate an access + refresh token pair and persist the hashed refresh
   * token to the database (token rotation strategy).
   */
  private async generateTokenPair(
    userId: string,
    email: string,
    name: string,
  ): Promise<TokenPair> {
    const payload: UserPayload = { sub: userId, email, name };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
      }),
    ]);

    // Hash & persist refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + this.parseDuration(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefresh,
        userId,
        expiresAt,
      },
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /** Convert Prisma User entity to SafeUser (strips password) */
  private toSafeUser(user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Parse simple duration strings like "7d", "15m", "1h" → milliseconds.
   */
  private parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    switch (unit) {
      case 's': return value * 1_000;
      case 'm': return value * 60 * 1_000;
      case 'h': return value * 60 * 60 * 1_000;
      case 'd': return value * 24 * 60 * 60 * 1_000;
      default:  return 7 * 24 * 60 * 60 * 1_000; // fallback 7d
    }
  }
}
