import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  imports: [
    // Default strategy for @UseGuards(AuthGuard())
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Register JWT asynchronously so environment variables are available
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET ?? 'fallback_access_secret',
        signOptions: {
          expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,    // Validates JWT bearer tokens in guards
    JwtAuthGuard,   // Guards that protect authenticated routes
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule, PassportModule],
})
export class AuthModule {}
