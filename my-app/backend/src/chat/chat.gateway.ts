import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'
import signature from 'cookie-signature';
import {connection} from '../db'
// import { Inject, forwardRef } from '@nestjs/common'

@WebSocketGateway({
  cors: { origin: process.env.DOMAIN, credentials: true }
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;
  @SubscribeMessage('joinChat')
  chatRoom(client: Socket, dataClient: Object){
    console.log(dataClient, 20, 'joinChat')
    const cookies = client.handshake.headers.cookie;
    let newCookies_:any = []
    if(cookies!==undefined || cookies!==null){
      const newCookies = cookies?.split("; ")
      newCookies?.map((i)=>{
        newCookies_.push(i.split("="))
      })
    }
    newCookies_ = newCookies_.flat().filter(item => !['email', 'login'].includes(item));
    let email = newCookies_[0]
    let token = newCookies_[1]
    if(process.env.SECRET){
      email = signature.unsign(email, process.env.SECRET)
      token = signature.unsign(token, process.env.SECRET)
      if(email && token){
        console.log(email, token, 'ok', 35)
        const developers = connection.collection('data')
        console.log(dataClient)
        // const resp = developers.find({})
      }else{
        return
      }
    }else{
      return
    }
    // console.log(dataClient, 19, 'chatGateway', cookies)
  }
  // @SubscribeMessage('connect')
  // connect(client:Socket, dataClient: Object){
  //   console.log('connect', dataClient, client)
  // }
}