import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GuestService } from './guest.service';
import * as dotenv from 'dotenv';
import signature from 'cookie-signature'
import { Cron } from '@nestjs/schedule';
import { deleteAccountGuest } from './scripts';
import { resumeAndPrerender } from 'react-dom/static';
dotenv.config();
const SECRET_ = process.env.SECRET

@Controller('guest')
export class GuestController {
    constructor(private readonly service: GuestService
    ) {}
    @Get('/guestAccess')
    async guestAccess(@Res() res: Response){
        const r = await this.service.GuestAccess()
        if(r.ok===1 && r.data !== undefined && SECRET_){
            res.cookie('email', signature.sign(r.data.user, SECRET_), {httpOnly: true, sameSite:'strict'})
            res.cookie('login', signature.sign(r.data.token, SECRET_), {httpOnly: true, sameSite:'strict'})
            res.json({redirect: `${process.env.DOMAIN}/projects`})
        }else{
            res.json({redirect: `${process.env.DOMAIN}/main_register`})
        }
    }
    @Post('/heartbeat')
    async heartBeat(@Body() body: any, @Req() request:Request){
        // console.log(body, request.cookies['email'])
        if(body.answer && SECRET_){
            let{email, login} = request.cookies
            if(email && login){
                const user = signature.unsign(email, SECRET_)
                const token = signature.unsign(login, SECRET_)
                if(user!=false && token !=false){
                    await this.service.heartBeatSession(user, token, body.answer)
                    const code = process.env.ACCESS_FOR_CRON
                    await this.service.disactivateSessions(process.env.ACCESS_FOR_CRON!, request.socket.remoteAddress||request.ip||request.connection.remoteAddress||'undefined', user, token)
                    await this.service.getUnactiveSessions(code!, request.socket.remoteAddress||request.ip||request.connection.remoteAddress||'undefined')
                    console.log('heartBeat')
                }
            }
        }
        return {status:200}
    }
    @Cron('*/4 * * * * *')
    async sessionCleaner(){
        await deleteAccountGuest(process.env.ACCESS_FOR_CRON!)
    }
    @Get('getLogin')
    async testFunction(){
        await new Promise(resolve=>setTimeout(resolve, 200))
        return{resp: 'ok'}
    }
}