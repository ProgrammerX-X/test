import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import signature from 'cookie-signature'
import { chatService } from './chat.service';
import * as dotenv from 'dotenv';
dotenv.config();
const SECRET_ = process.env.SECRET || 'rezervSECRET'
@Controller('chat')
export class chatController {
  constructor(private readonly service: chatService) {}
  @Post('sendMessage')
  async sendMessage(@Body() body: any, @Req() request: Request){
    const message = body.message
    const email_encrypt = request.cookies.email
    const token_encrypt = request.cookies.login
    const email = signature.unsign(email_encrypt, SECRET_)
    const project = body.project
    const projectId = body.projectId
    const type = body.type
    const token = signature.unsign(token_encrypt, SECRET_)
    if (message !== undefined && message != '' && email != null && email != false && token != null && token != false && token != undefined){
        const time = new Date
        let year = (`${time.getFullYear()}:${time.getMonth()}:${time.getDate()}`)
        let hours = (`${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`)
          if(type==='block'){
            const block = body.block
            console.log(email, project, block, message, year, hours, 16)
            await this.service.sendMessages(email, token, type, projectId, project, message, {year: year, hours: hours}, block)
          }else if(type === 'global'){
            console.log(email, project, message, year, hours, 33)
          }else{
            return {error: 'enter correct message, 35'}
          }
        return {status: 200}
    }else{
        return {error: 'enter correct message, 39'}
    }
  }
  @Post('getMessage')
  async getMessage(@Body() body: any, @Req() request: Request){
    const email_encrypt = request.cookies.email
    const token_encrypt = request.cookies.login
    const email = signature.unsign(email_encrypt, SECRET_)
    const projectId = body.projectId
    const project = body.project
    const type = body.type
    const token = signature.unsign(token_encrypt, SECRET_)
    if (email != false && email != null && token != false && token != undefined && token != null){
        const time = new Date
        // let year = (`${time.getFullYear()}:${time.getMonth()}:${time.getDate()}`)
        // let hours = (`${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`)
        let resp:any
          if(type==='block'){
            const block = body.block
            // console.log(email, projectId, block, year, hours, 51)
            resp = await this.service.getMessages(email, token, type, projectId, project, block)
            return resp
          }else if(type === 'global'){
            resp = await this.service.getMessages(email, token, type, projectId, project)
            return resp
          }else{
            return {error: 'enter correct message, 55'}
          }
    }else{
        return {error: 'enter correct message, 59'}
    }
  }
}