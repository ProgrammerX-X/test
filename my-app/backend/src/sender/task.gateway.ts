// task.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'
import {connection} from '../db'
import {checkLogin} from '../sender/access'
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
  @SubscribeMessage('updateBlocks')
  async upBlocks(blocks: any, email:string, projectId: string, token: string){
    console.log(blocks, email, projectId, token)
    const resp = await checkLogin(email, token)
    let resp_ = await connection.collection('projects').findOne({email: email, 'projects.id_proj': projectId})
    if(resp_ === null){
      resp_ = await connection.collection('projects').findOne({'somelProjects.id_proj': projectId, email: email})
    }
    if(resp!=null){
      this.server.emit('updateBlocks', blocks)

    }
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