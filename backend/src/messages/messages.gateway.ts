import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/jwt.strategy';

interface SendMessagePayload {
  bookingId: string;
  content: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // socket.id → userId
  private readonly connectedUsers = new Map<string, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify<JwtPayload>(token);
      this.connectedUsers.set(socket.id, payload.sub);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    this.connectedUsers.delete(socket.id);
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() bookingId: string,
    @ConnectedSocket() socket: Socket,
  ): void {
    socket.join(`booking:${bookingId}`);
  }

  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() bookingId: string,
    @ConnectedSocket() socket: Socket,
  ): void {
    socket.leave(`booking:${bookingId}`);
  }

  @SubscribeMessage('send')
  async handleSend(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const userId = this.connectedUsers.get(socket.id);
    if (!userId) return;

    try {
      const message = await this.messagesService.send(
        payload.bookingId,
        userId,
        payload.content,
      );

      this.server
        .to(`booking:${payload.bookingId}`)
        .emit('message', message);
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('read')
  async handleRead(
    @MessageBody() bookingId: string,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const userId = this.connectedUsers.get(socket.id);
    if (!userId) return;
    await this.messagesService.markRead(bookingId, userId);
  }
}
