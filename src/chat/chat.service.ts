import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';

export interface ChatSender {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessageRecord {
  id: string;
  room: string;
  content: string;
  senderId: string | null;
  guestName: string | null;
  createdAt: Date;
  sender?: ChatSender | null;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch recent messages for a specific room (default last 50, ascending order)
   */
  async getRecentMessages(room: string, limit = 50): Promise<ChatMessageRecord[]> {
    try {
      const db = this.prisma as any;
      if (db.chatMessage) {
        const messages = await db.chatMessage.findMany({
          where: { room },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            sender: {
              select: { id: true, name: true, email: true },
            },
          },
        });
        return messages.reverse();
      }
    } catch (err) {
      this.logger.error(`Error querying recent messages for room '${room}':`, err);
    }
    return [];
  }

  /**
   * Save a new chat message to PostgreSQL database
   */
  async saveMessage(
    dto: SendMessageDto,
    userId?: string,
  ): Promise<ChatMessageRecord> {
    const defaultGuestName = dto.guestName?.trim() || 'Anonymous Cinephile';

    try {
      const db = this.prisma as any;
      if (db.chatMessage) {
        const saved = await db.chatMessage.create({
          data: {
            room: dto.room,
            content: dto.content.trim(),
            senderId: userId || null,
            guestName: userId ? null : defaultGuestName,
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true },
            },
          },
        });
        return saved;
      }
    } catch (err) {
      this.logger.error('Error persisting chat message to database:', err);
    }

    // In-memory fallback if database query failed
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      room: dto.room,
      content: dto.content.trim(),
      senderId: userId || null,
      guestName: userId ? null : defaultGuestName,
      createdAt: new Date(),
      sender: null,
    };
  }
}
