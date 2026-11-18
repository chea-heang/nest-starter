import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret:
          process.env.JWT_ACCESS_SECRET ??
          'change_me_access_secret_at_least_32_chars',
        signOptions: {
          expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
        },
      }),
    }),
  ],
  providers: [ChatGateway, ChatService, WsJwtGuard],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
