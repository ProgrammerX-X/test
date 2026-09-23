import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, Query } from '@nestjs/common';
import { ProPanelHandlerService } from './pro-panel_handler.service';
import { UpdateProPanelHandlerDto } from './dto/update-pro-panel_handler.dto';
import type { Request, Response } from 'express';
import type { CreateProPanelHandlerDto } from './dto/create-pro-panel_handler.dto';
import signature from 'cookie-signature'
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
dotenv.config();
// import {getBlocksFunction} from './pro-panel_handler.service'
const SECRET_ = process.env.SECRET
@Controller('proPanel')
export class ProPanelHandler {
  constructor(private readonly service: ProPanelHandlerService,
    // private eventEmitter: EventEmitter2
  ) {}
  @Post()
  async blockReturn(@Body('email') email: string, @Body('project') project: string, @Body('projectId') projectId:any, @Req() request:Request) {
    const email_cookies = signature.unsign(request.cookies.email, SECRET_!)
    const token = signature.unsign(request.cookies.login, SECRET_!)
    console.log(email_cookies, token, projectId, 24)
    if(email_cookies && token){
      project = decodeURIComponent(project)
      let resp = await this.service.getBlocksFunction(email_cookies, token, project, false, projectId);
      // console.log(resp, 24, 'blocks')
      if (resp.blocks.length===0){
        return {resp: 'redirect'}
      }else{
        return {resp: resp};
      }
    }else{
      return{resp: 'redirect'}
    }
  }

  @Cron('*/30 * * * * *')
  async updateCash(){
    
  }

  @Get('/get_email')
  async getEmail(@Req() req: Request){
    let response = req.cookies.email
    let cookies_all = signature.unsign(response, SECRET_!)
    return {response: cookies_all}
  }
  @Post('/projects')
  async getProjects(@Body('email') email: string){
    let resp = await this.service.getAllProjects(email);
    return {resp: resp.result, emails: resp.email}
  }
  @Post('/edit_projects')
  async editProjects(@Body() body: any, @Req() req: Request){
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_!)
    let resp = {error: ''}
    if(body.newTitle.trim() === 'teams'){
      return {error: 'Please, check another title.'}
    }
    else if(body.newTitle.trim() != body.oldTitle.trim() || body.newDirection.trim() != body.oldDirection.trim()){
      resp = await this.service.editProject(body.email, body.index,
      body.newTitle.trim(), body.oldTitle.trim(), body.newDirection.trim(), body.oldDirection.trim(), response, body.projectId)
    }
    return({err: resp})
  }
  @Post('/create_project')
  async createProj(@Body() body: any, @Req() req: Request){
    let title = body.title.trim()
    let email = req.cookies.email
    let response_ = req.cookies.login
    console.log(req.cookies)
    console.log(title, email, response_)
    if(email!=undefined && response_!=undefined){
      response_ = signature.unsign(response_, SECRET_!)
      email = signature.unsign(email, SECRET_!)
      if (!response_ && !email) return {status: {error:"Error. Login or register in app."}}
      if((title === '' || title === undefined || body.direction==='' || body.direction === undefined)){
        return{status: {error:'Empty title or direction!'}}
      }else if(title==='teams'){
        return{status: {error:'Please, write another title.'}}
      }
      else{
        // body.email
        const response = await this.service.pushProject(email, title, body.direction, response_)
        return {status: response}
      }
    }else{
      let logFile = path.join(process.cwd(), 'logs', 'logFile.txt');
      fs.appendFile(logFile, `${new Date()}, No signed cookie acccess for create project, IP: ${req.socket.remoteAddress || req.connection.remoteAddress || req.ip}.\n`)
      return{status: {error:'Login please.'}}
    }
  }
    @Post('/create_block')
  async createBlock(@Body() body: any, @Req() req: Request){
    // console.log(body.email)
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_!)
    if (body.color == '' || body.color == undefined){
      body.color = '#000000'
    }
    if (body.title == ''){
      return {error: 'Enter name for your block'}
    }else{
      let error = await this.service.pushBlock(body.email, body.color, decodeURIComponent(body.project), body.title, body.projectId, response)
      // console.log(body)
      return {error: error.error}
    } 
  }
  @Post('/deleteProject')
  async deleteProject(@Body() body: any, @Req() req: Request){
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_!)
    let error = await this.service.deleteProj(body.email, body.title, token)
    // console.log(error)
    return {error: error}
  }

  // @Post('/addWorkers')
  // async addWorkers(@Body() body: any){
  //   console.log(1)
  //   // console.log(body.email, body.title)
  //   return{status: 200}
  // }
}
// OLD MEAN BAD WORK
type EventTypes = {
  type:string,
  data?: {email:string, project:string, blocksData:Array<Object>}
}
type getBlocksEventTypes = {
  project: string
}
export class eventHandler{
  constructor(private eventEmitter: EventEmitter2,
    private readonly service: ProPanelHandlerService
  ){}
  
  @Post('/getBlocksEvent')
  async getBlocksEvent(@Body() body:getBlocksEventTypes){
    

    const eventEmData = await new Promise<EventTypes>((resolve)=>{
      const handler = (data:any)=>{
        console.log("data: ", data, 27)
        Object.assign(data, {type:''})
        resolve(data)
      }
        this.eventEmitter.on("updateBlocks", handler)
        setTimeout(()=>{
          this.eventEmitter.off("updateBlocks", handler)
          resolve({type: "Time out."})
        }, 10000)
      })

      const type = eventEmData.type
      console.log('type:', type, 147)
      if(type != ''){
        return {resp: type}
      }else if(eventEmData.data!=undefined && eventEmData.data.blocksData.length>0){
        // if(email)
        return {resp: eventEmData.data.blocksData}
      }else{
        return {resp: 'redirect'}
      }
  }
}