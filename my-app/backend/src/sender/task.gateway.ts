// task.gateway.ts
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
  cors: { origin: 'http://localhost:3000', credentials: true }
})
export class TaskGateway {
  @WebSocketServer()
  server!: Server;

  // handleConnection(){
  //   console.log('Connect!')
  // }
  // handleDisconnect(){
  //   console.log('Disconnect!')
  // }
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() owner: string,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(owner);
  }
  upBlocks(blocks: any){
    this.server.emit('updateBlocks', blocks)
  }
  updateTasks(tasks: any){
    this.server.emit('updateTasks_', tasks)
  }
  handleConnection(socket: Socket) {
      const types = socket.handshake.auth
      const email = socket.handshake.auth.email;
      socket.join(email);
  }
}