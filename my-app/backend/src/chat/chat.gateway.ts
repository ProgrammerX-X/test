import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'
// import { Inject, forwardRef } from '@nestjs/common'

@WebSocketGateway({
  cors: { origin: process.env.DOMAIN, credentials: true }
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;
  @SubscribeMessage('joinChat')
  chatRoom(client: Socket, dataClient: Object){
    console.log(client, dataClient, 19, 'chatGateway')
  }
  @SubscribeMessage('connect')
  connect(client:Socket){
    console.log('connect')
  }
}