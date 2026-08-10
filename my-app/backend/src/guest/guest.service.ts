import { Injectable, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
// import 'jsonwebtoken'
import signature from 'cookie-signature'
import {connection} from '../db'
import { redirect } from 'next/dist/server/api-utils';
const SECRET_ = process.env.SECRET
import { checkToken } from 'src/sender/access';
import { jwtAuth } from 'src/sender/mail.service';
const { ObjectId } = require('mongodb');
@Injectable()
export class GuestService {
    constructor(private readonly jwtService: jwtAuth){}
    async GuestAccess(){
        const user = faker.internet.username()
        const token_gen = require('jsonwebtoken')
        const token = token_gen.sign(
            { userId: user, role: 'user' },
            process.env.TOKEN_JWT
        )
        if(user && token){
            const data = connection.collection('data')
            const resp = await data.insertOne({
                email: user,
                login: token,
                projects: []
            })
            await connection.collection('projects').insertOne({email: user, projects: [], active:true, somelProjects:[]})
            await connection.collection('teams').insertOne({projects: {owner: user, proj:[{}]}})
            return {ok:1, data: {user: user, token: token}}
        }else{
            return{ok:0, data: undefined}
        }
        // token, user => in db + isConfirmed = true
    }
    async heartBeatSession(email: string, token:string, session:boolean){
        const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
        const resp = await checkToken(email, token)
        if(resp!=null && !email_validation.test(email)){
            const projects = connection.collection('projects')
            await projects.updateOne({email: email}, {$set: {active: session}})
            connection.collection('teams').updateOne({'projects.owner': email}, {$set: {active: session}})
            connection.collection('data').updateOne({email:email}, {$set: {active:session}})
            return {ok:1}
        }else{
            return {ok:0}
        }
    }
    async clearSessions(email:string, token:string){
        await this.jwtService.deleteAccount(email, token)
        
    }
}