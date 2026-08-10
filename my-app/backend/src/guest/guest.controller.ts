import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GuestService } from './guest.service';
import * as dotenv from 'dotenv';
import signature from 'cookie-signature'
import { Cron } from '@nestjs/schedule';
dotenv.config();
const SECRET_ = process.env.SECRET

@Controller('guest')
export class GuestController {
    constructor(private readonly service: GuestService,
        // private readonly serviceSender: jwtAuth
    ) {}
    @Get('/guestAccess')
    async guestAccess(@Res() res: Response){
        const r = await this.service.GuestAccess()
        if(r.ok===1 && r.data !== undefined && SECRET_){
            res.cookie('email', signature.sign(r.data.user, SECRET_), {httpOnly: true})
            res.cookie('login', signature.sign(r.data.token, SECRET_), {httpOnly: true})
            res.json({redirect: `${process.env.DOMAIN}/projects`})
        }else{
            res.json({redirect: `${process.env.DOMAIN}/main_register`})
        }
    }
    @Post('/heartbeat')
    async heartBeat(@Body() body: any, @Req() request:Request){
        // console.log(body, request.cookies['email'])
        if(body.answer && SECRET_){
            const user = signature.unsign(request.cookies['email'], SECRET_)
            const token = signature.unsign(request.cookies['login'], SECRET_)
            if(user!=false && token !=false){
               let resp = await this.service.heartBeatSession(user, token, body.answer)
               console.log(resp)
            }else{
                console.log('you are not logged')   
            }
        }
        return {status:200}
    }
    @Cron('*/5 * * * *')
    async sessionCleaner(@Req() request:Request){
        // if(SECRET_){
        //     const email = signature.unsign(request.cookies['email'], SECRET_)
        //     const token = signature.unsign(request.cookies['login'], SECRET_)
        //     const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
        //     if (email!=false && token!=false && !email_validation.test(email)){
        //         this.serviceSender.deleteAccount(email, token)
        //     }
        // }
    }
}