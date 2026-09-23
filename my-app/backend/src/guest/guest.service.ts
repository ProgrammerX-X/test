import { Injectable, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
// import 'jsonwebtoken'
import signature from 'cookie-signature'
import {connection} from '../db'
import { redirect } from 'next/dist/server/api-utils';
import {promises as fs} from 'fs'
const SECRET_ = process.env.SECRET
import { checkToken } from 'src/sender/access';
const { ObjectId } = require('mongodb');
import path from 'path'
@Injectable()
export class GuestService {
    async GuestAccess(){
        const user = faker.internet.username()
        const token_gen = require('jsonwebtoken')
        const token = token_gen.sign(
            { userId: user, role: 'user' },
            process.env.TOKEN_JWT
        )
        if(user && token){
            const data = connection.collection('data')
            const id = new ObjectId()
            const resp = await data.insertOne({
                email: user,
                login: token,
                projects: [
                    {id_proj: id,
                        title_proj:'Guest',
                        blocks:[{
                            id: new ObjectId(),
                            method: 'Guest',
                            mood: '#000000',
                            tasks:{
                                title:['Test task'],
                                direction:['Guest task for testing functions.'],
                                developers: [],
                                deadline:[{start:"2026.08.08"}, {end:"2026.08.09"}]
                            }
                        }]
                    }
                ],
                active: true,
                date: new Date()
            })
            await connection.collection('projects').insertOne({email: user, projects: [
                {id_proj: id, title: 'Guest', direction: 'Description for guest project'}
            ], active:true, date:new Date(), somelProjects:[]})
            await connection.collection('teams').insertOne(
                {projects: {owner: user, proj:
                    [
                        {
                            id_proj: id, 
                            project_name: 'Guest',
                            confirmed: 
                                [{label: 'Unteamed', 
                                options: 
                                    {
                                        value: ['guest@gmail.com'], 
                                        label:['guest@gmail.com'], 
                                        email: ['guest@gmail.com'], 
                                        roots:['read']
                                    }
                                }],
                            invited: [],
                            team: [{
                                label: 'GuestTeam', 
                                options:{
                                    value: [], 
                                    label: [], 
                                    email: []
                                } 
                            }]
                        }
                    ]
                }
            })
                // roots: []}
                // }}]
            // }]}, 
            // date: new Date(), active:true})
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
            await projects.updateMany({email: email}, {$set: {active: session, date: new Date()}})
            await connection.collection('teams').updateMany({'projects.owner': email}, {$set: {active: session, date: new Date()}})
            await connection.collection('data').updateMany({email:email}, {$set: {active:session, date: new Date()}})
            return {ok:1}
        }else{
            return {ok:0}
        }
    }
    async getUnactiveSessions(VALIDATION_CODE:string, IP:string){
        let logFile = path.join(`${process.cwd()}`,'logs','logFile.txt')
        if(VALIDATION_CODE===process.env.ACCESS_FOR_CRON){
            const cursor_data = connection.collection("data")
            let resp = await cursor_data.find({active:false}).toArray()
            // console.log(resp)
            console.log(resp, 109)
            if(resp.length>0){
                fs.appendFile(logFile, `${resp}, active: false\n`)
            }
        }else{
            fs.appendFile(logFile, `Denied access: ${IP}\n`)
        }
    }
    async disactivateSessions(DISACTIVATE_CODE:string, IP:string, email?:any, token?:any){
        let logFile = path.join(`${process.cwd()}`,'logs','logFile.txt')
        const tokenRight = await checkToken(email, token)
        await fs.mkdir(path.dirname(logFile), {recursive:true})
        try{
            if(tokenRight != null && DISACTIVATE_CODE===process.env.ACCESS_FOR_CRON){
                const projects = connection.collection('projects')
                await projects.updateMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 4]}}, {$set: {active: false}})
                await connection.collection('teams').updateMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 4]}}, {$set: {active: false}})
                await connection.collection('data').updateMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 4]}}, {$set: {active: false}})
            }else{
                fs.writeFile(logFile, `${new Date().toISOString().replace('T', ' ')}, Access denied, IP: ${IP || undefined}`, { flag: 'a' },)
            }
        }catch(e){
            await fs.writeFile(logFile, `${new Date().toISOString().replace('T', ' ')}, Error(code, ~58, guest.service.ts)! ${e}`, { flag: 'a' },)
        }
    }
}