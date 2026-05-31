import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Real-time transport for the live queue. Clients join a room named after
 * their salonId, and the service broadcasts `queue-updated` to that room
 * whenever the queue changes. No polling anywhere.
 *
 *   client -> socket.emit('join-salon', salonId)
 *   server -> socket.to(salonId).emit('queue-updated', payload)
 */
@WebSocketGateway({ namespace: 'queue', cors: { origin: '*' } })
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() private server!: Server;
  private readonly logger = new Logger('QueueGateway');

  handleConnection(client: Socket): void {
    this.logger.log(`socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`socket disconnected: ${client.id}`);
  }

  /** A dashboard/PWA client subscribes to its salon's queue room. */
  @SubscribeMessage('join-salon')
  onJoinSalon(@MessageBody() salonId: string, @ConnectedSocket() client: Socket): void {
    client.join(salonId);
  }

  /** Called by QueueService after any mutation. */
  broadcast(salonId: string, payload: unknown): void {
    this.server.to(salonId).emit('queue-updated', payload);
  }
}
