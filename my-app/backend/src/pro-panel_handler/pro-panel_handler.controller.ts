import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import { ProPanelHandlerService } from './pro-panel_handler.service';
import { UpdateProPanelHandlerDto } from './dto/update-pro-panel_handler.dto';
import type { Request, Response } from 'express';
import type { CreateProPanelHandlerDto } from './dto/create-pro-panel_handler.dto';
import signature from 'cookie-signature'
import * as dotenv from 'dotenv';
dotenv.config();
// import {getBlocksFunction} from './pro-panel_handler.service'
const SECRET_ = process.env.SECRET || 'rezervSECRET'
@Controller('proPanel')
export class ProPanelHandler {
  constructor(private readonly service: ProPanelHandlerService) {}
  
  @Post()
  async blockReturn(@Body('email') email: string, @Body('project') project: string) {
    // console.log(email, project, 15)
    let resp = await this.service.getBlocksFunction(email, project);
    // console.log(resp.blocks[0].tasks.direction, 19)
    if (resp==='redirect'){
      return {resp: 'redirect'}
    }else{
      return {resp: resp};
    }
  }
  @Get('/get_email')
  async getEmail(@Req() req: Request){
    let response = req.cookies.email
    let cookies_all = signature.unsign(response, SECRET_)
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
    response = signature.unsign(response, SECRET_)
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
    response_ = signature.unsign(response_, SECRET_)
    email = signature.unsign(email, SECRET_)
    if(title === '' || title === undefined || body.direction==='' || body.direction === undefined){
      return{status: {error:'Empty title or direction!'}}
    }else if(title==='teams'){
      return{status: {error:'Please, write another title.'}}
    }
    else{
      // body.email
      const response = await this.service.pushProject(email, title, body.direction, response_)
      return {status: response}
    }
  }
    @Post('/create_block')
  async createBlock(@Body() body: any, @Req() req: Request){
    // console.log(body.email)
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_)
    if (body.color == '' || body.color == undefined){
      body.color = '#000000'
    }
    if (body.title == ''){
      return {error: 'Enter name for your block'}
    }else{
      let error = await this.service.pushBlock(body.email, body.color, body.project, body.title, body.projectId, response)
      // console.log(body)
      return {error: error.error}
    } 
  }
  @Post('/deleteProject')
  async deleteProject(@Body() body: any, @Req() req: Request){
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_)
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