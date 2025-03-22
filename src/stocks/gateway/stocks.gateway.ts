import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    credentials: true,
    methods: ['GET', 'POST'],
  },
  allowEIO3: true,
})
@UseGuards(WsJwtGuard)
export class StocksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(StocksGateway.name);
  private clients: Set<string> = new Set();

  afterInit(server: Server) {
    this.logger.log('WebSocket Server Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients.add(client.id);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  @SubscribeMessage('subscribeToStocks')
  handleSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.log(
      `Client subscribed: ${client.id} with data: ${JSON.stringify(data)}`,
    );
    return {
      event: 'subscriptionSuccess',
      data: 'Subscribed to stock updates',
    };
  }

  sendStockUpdate(data: any) {
    if (this.clients.size > 0) {
      this.server.emit('stockUpdate', data);
    } else {
      this.logger.warn('No clients connected. Skipping stock update.');
    }
  }
}
