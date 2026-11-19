import { ChatGateway } from './chat.gateway';
import { ChatService, ChatMessageRecord } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  const mockPrismaService = {
    chatMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(() => {
    chatService = new ChatService(mockPrismaService as any);
    gateway = new ChatGateway(chatService, mockJwtService as any);
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
    expect(chatService).toBeDefined();
  });

  describe('handleConnection & handleDisconnect', () => {
    it('should register an authenticated client and broadcast count', async () => {
      const mockSocket: any = {
        id: 'sock-123',
        handshake: {
          auth: { token: 'valid.token' },
          headers: {},
        },
        data: {},
      };

      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        name: 'Peter Parker',
        email: 'peter@spider.com',
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.data.user).toEqual({
        sub: 'user-1',
        name: 'Peter Parker',
        email: 'peter@spider.com',
      });
      expect(mockServer.emit).toHaveBeenCalledWith('onlineCount', { count: 1 });
    });

    it('should register a guest client when no token provided', async () => {
      const mockSocket: any = {
        id: 'guest-456',
        handshake: {
          auth: { guestName: 'MovieBuff' },
          headers: {},
        },
        data: {},
      };

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.data.user).toBeUndefined();
      expect(mockServer.emit).toHaveBeenCalledWith('onlineCount', { count: 1 });
    });

    it('should handle disconnect and decrement count', async () => {
      const mockSocket: any = {
        id: 'sock-999',
        handshake: { auth: {}, headers: {} },
        data: {},
      };

      await gateway.handleConnection(mockSocket);
      gateway.handleDisconnect(mockSocket);

      expect(mockServer.emit).toHaveBeenLastCalledWith('onlineCount', { count: 0 });
    });
  });

  describe('handleJoinRoom', () => {
    it('should join specified room, leave previous non-socket rooms, and emit history', async () => {
      const mockHistory: ChatMessageRecord[] = [
        {
          id: 'msg-1',
          room: 'lounge',
          content: 'Hello World',
          senderId: 'user-1',
          guestName: null,
          createdAt: new Date(),
          sender: { id: 'user-1', name: 'Peter', email: 'peter@spidey.com' },
        },
      ];

      jest
        .spyOn(chatService, 'getRecentMessages')
        .mockResolvedValue(mockHistory);

      const mockSocket: any = {
        id: 'sock-1',
        rooms: new Set(['sock-1', 'previous-room']),
        leave: jest.fn(),
        join: jest.fn(),
        emit: jest.fn(),
      };

      const result = await gateway.handleJoinRoom(mockSocket, { room: 'lounge' });

      expect(mockSocket.leave).toHaveBeenCalledWith('previous-room');
      expect(mockSocket.join).toHaveBeenCalledWith('lounge');
      expect(mockSocket.emit).toHaveBeenCalledWith('roomHistory', {
        room: 'lounge',
        messages: mockHistory,
      });
      expect(result).toEqual({ success: true, room: 'lounge' });
    });
  });

  describe('handleSendMessage', () => {
    it('should save message and broadcast to room for authenticated user', async () => {
      const savedMsg: ChatMessageRecord = {
        id: 'msg-new',
        room: 'spiderman',
        content: 'Loved No Way Home!',
        senderId: 'user-42',
        guestName: null,
        createdAt: new Date(),
        sender: { id: 'user-42', name: 'Miles Morales', email: 'miles@ny.com' },
      };

      jest.spyOn(chatService, 'saveMessage').mockResolvedValue(savedMsg);

      const mockSocket: any = {
        id: 'sock-user',
        data: {
          user: { sub: 'user-42', name: 'Miles Morales' },
        },
      };

      const result = await gateway.handleSendMessage(mockSocket, {
        room: 'spiderman',
        content: 'Loved No Way Home!',
      });

      expect(chatService.saveMessage).toHaveBeenCalledWith(
        { room: 'spiderman', content: 'Loved No Way Home!', guestName: 'Miles Morales' },
        'user-42',
      );
      expect(mockServer.to).toHaveBeenCalledWith('spiderman');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', savedMsg);
      expect(result.success).toBe(true);
    });
  });

  describe('handleTyping', () => {
    it('should broadcast userTyping to others in room', () => {
      const mockTo = jest.fn();
      const mockSocket: any = {
        id: 'sock-typing',
        data: { user: { name: 'Gwen' } },
        to: jest.fn().mockReturnValue({ emit: mockTo }),
      };

      gateway.handleTyping(mockSocket, { room: 'lounge', isTyping: true });

      expect(mockSocket.to).toHaveBeenCalledWith('lounge');
      expect(mockTo).toHaveBeenCalledWith('userTyping', {
        room: 'lounge',
        user: 'Gwen',
        isTyping: true,
      });
    });
  });
});
