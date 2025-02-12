import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StocksService } from './stocks.service';

@WebSocketGateway()
export class StocksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly stocksService: StocksService) {}

  afterInit() {
    console.log('WebSocket initialized');
  }

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  async sendStockUpdates() {
    const stocks = await this.stocksService.getAllStockData();
    this.server.emit('stocksUpdate', stocks);
  }
}
