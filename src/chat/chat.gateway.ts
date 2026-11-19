import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService, ChatMessageRecord } from './chat.service';
import { JoinRoomDto, SendMessageDto, TypingDto } from './dto/chat.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';

export interface OnlineUserInfo {
  socketId: string;
  name: string;
  userId?: string;
  isGuest: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, OnlineUserInfo>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log('Chat WebSocket Gateway initialized on namespace /chat');
  }

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.auth?.token ||
        (typeof client.handshake.headers?.authorization === 'string'
          ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined);

      if (rawToken) {
        const payload = this.jwtService.verify(rawToken, {
          secret:
            process.env.JWT_ACCESS_SECRET ??
            'change_me_access_secret_at_least_32_chars',
        });
        client.data.user = payload;
      }
    } catch {
      // Allow unauthenticated guest connections
    }

    const isGuest = !client.data.user;
    const userName =
      client.data.user?.name ||
      client.handshake.auth?.guestName ||
      `Guest-${client.id.slice(-4)}`;

    this.onlineUsers.set(client.id, {
      socketId: client.id,
      name: userName,
      userId: client.data.user?.sub,
      isGuest,
    });

    this.logger.log(
      `Socket connected: ${client.id} [${isGuest ? 'Guest' : 'User'}: ${userName}]`,
    );
    this.broadcastOnlineCount();
  }

  handleDisconnect(client: Socket) {
    this.onlineUsers.delete(client.id);
    this.logger.log(`Socket disconnected: ${client.id}`);
    this.broadcastOnlineCount();
  }

  private broadcastOnlineCount() {
    if (this.server) {
      this.server.emit('onlineCount', { count: this.onlineUsers.size });
    }
  }

  @SubscribeMessage('getOnlineCount')
  handleGetOnlineCount(@ConnectedSocket() client: Socket) {
    client.emit('onlineCount', { count: this.onlineUsers.size });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<{ success: boolean; room: string }> {
    if (!dto || !dto.room) {
      return { success: false, room: 'unknown' };
    }

    const targetRoom = dto.room;

    // Leave any other room previously joined except own socket room
    for (const r of client.rooms) {
      if (r !== client.id && r !== targetRoom) {
        client.leave(r);
      }
    }

    client.join(targetRoom);
    this.logger.log(`Client ${client.id} joined room: ${targetRoom}`);

    // Retrieve and deliver recent room messages to the newly joined client
    const history: ChatMessageRecord[] =
      await this.chatService.getRecentMessages(targetRoom);
    client.emit('roomHistory', { room: targetRoom, messages: history });

    return { success: true, room: targetRoom };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    if (dto?.room) {
      client.leave(dto.room);
      this.logger.log(`Client ${client.id} left room: ${dto.room}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ): Promise<{ success: boolean; data?: ChatMessageRecord }> {
    if (!dto || !dto.content || !dto.room) {
      return { success: false };
    }

    const userId = client.data.user?.sub;
    const guestName =
      client.data.user?.name ||
      dto.guestName ||
      this.onlineUsers.get(client.id)?.name ||
      'Anonymous Cinephile';

    const savedMessage = await this.chatService.saveMessage(
      {
        room: dto.room,
        content: dto.content,
        guestName,
      },
      userId,
    );

    // Broadcast the newly created message to all clients in the room
    this.server.to(dto.room).emit('newMessage', savedMessage);

    return { success: true, data: savedMessage };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TypingDto,
  ) {
    if (!dto || !dto.room) return;

    const senderName =
      client.data.user?.name ||
      this.onlineUsers.get(client.id)?.name ||
      'Someone';

    // Broadcast typing indicator to all clients in the room except the typing sender
    client.to(dto.room).emit('userTyping', {
      room: dto.room,
      user: senderName,
      isTyping: !!dto.isTyping,
    });
  }
}
