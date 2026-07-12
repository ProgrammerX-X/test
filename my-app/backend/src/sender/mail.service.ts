import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MongoClient, ObjectId } from 'mongodb';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { execArgv } from 'process';
import {connection, connection_login} from '../db'
import { TaskGateway } from './task.gateway';
import { ProPanelHandlerService } from 'src/pro-panel_handler/pro-panel_handler.service';
import { checkToken, checkRoots } from './access';
import { Inject, forwardRef } from '@nestjs/common'
import { OnModuleInit } from '@nestjs/common';
import {getEmails_forSockets, getProjects_create_forSocket, developers_forSockets, getProjectsAll_socket,
    getBlocksFunction_socket
} from './access'
import { Socket } from 'socket.io';
@Injectable()
export class SenderMail{
    private transporter
    constructor(){
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        })
    } 
    async sendEmail( email: string, project: string, fromEmail: string, subject: string, html: string, login_token:string){
        const user = connection.collection('projects')
        const owner = await user.findOne({email: fromEmail, 'projects.title': project}, {projection: {projects: 1}})
        if (email === fromEmail) return {error: 'Please, select another email.'}
        let newProjectId = project
        if (owner != null){
        newProjectId = owner.projects[0].id_proj
        }else{  
        const guest_projects = await user.findOne({email: fromEmail, 'somelProjects.project': project},
            {projection: {'somelProjects.id_proj':1}}
        )
        const guest_index = await user.aggregate([
            {$match: {email: fromEmail}},
            {$unwind: {path: '$somelProjects', includeArrayIndex: 'projectsIndex'}},
            {$match: {'somelProjects.project': project}},
            {$project: {'index': '$projectsIndex'}}
        ]
        ).toArray()
        if(guest_projects!=null){
            newProjectId = guest_projects.somelProjects[guest_index[0].index].id_proj
        }else{
            console.log('some error. sendEmail error')
        }
        }
        const token_ = await checkToken(fromEmail, login_token)
        const roots_ =  await checkRoots(fromEmail, project, newProjectId, ['admin'])
        if (token_ !=null && roots_!=0){
            await this.transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: subject,
                html: html
            })
            const cursor = connection.collection('teams')
            await cursor.updateOne(
            { 
                'projects.owner': fromEmail, 
                'projects.proj.project_name': project
            },
            { 
                $push: { 
                    'projects.proj.$.invited': {
                        email: email,
                        date_clean: new Date(Date.now() + 600*1000)
                    }
                } as any
            }
            )
            return {error: "Mail send!"}
        }else{
            return {error: "You don`t have permissions."}
        }
    }
    async clearInvite(){
        const cursor = connection.collection('teams')
        await cursor.updateMany(
        { 'projects.proj.invited.date_clean': { $lt: new Date() } },
        { $pull: { 'projects.proj.$[].invited': { date_clean: { $lt: new Date() } } } as any }
        )
    }
    async clearSeed(){
        const cursor = connection.collection('agree_email')
        await cursor.deleteMany({date_clean: { $lt: new Date() }})
    }
}
@Injectable()
export class jwtAuth{
    private transporter
    constructor(private jwtService: JwtService,
    @Inject(forwardRef(() => TaskGateway)) private taskGateway: TaskGateway,
    private readonly getBlocks: ProPanelHandlerService
) {
    this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
        }
    })
    }
    generateToken(email: string, project: string, fromEmail: string): string {
    const payload = { 
      email: email,
      project: project,
      fromEmail: fromEmail
    };
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string) {
    try {
      let resp = this.jwtService.verify(token);
      return resp;
    } catch (error) {
        return 'Invalid token'
    }
  }

  async seed(email: string){
    const cursor = connection.collection('agree_email')
    let resp = await cursor.findOne({email: email})
    const code = randomBytes(4).toString('hex').slice(0, 6);
    if (resp === null){
        await cursor.insertOne({email: email, code: code, date_clean: new Date(Date.now() + 300*1000)})
    }else{
        await cursor.updateOne({email: email}, {$set: {code: code, date_clean: new Date(Date.now() + 300*1000)}} as any)
    }
    await this.transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: `ProPanel Code`,
            html: `Your code for access: ${code}.`
        })
  }
  async checkDB(email: string, code: string, project: string, fromEmail: string){
    const cursor = connection.collection('agree_email')
    const cursor_1 = connection.collection('teams')
    const resp_ = await cursor_1.findOne({
    'projects.proj': {
        $elemMatch: {
        'confirmed.options.email': email,
        'project_name': project
        }
    }
    })
    if (resp_ === null){
        let checker = await cursor.findOne(
            { email: email },
            { projection: { code: 1, _id: 0 } }
        )
        if (checker !=null){
            if (code === checker?.code){
                await cursor.deleteOne({email: email})
                await cursor_1.updateOne(
                { 
                    'projects.owner': fromEmail,
                    'projects.proj.project_name': project
                },
                { 
                    $push: { 'projects.proj.$[proj].confirmed.$[conf].options.email': email,
                        'projects.proj.$[proj].confirmed.$[conf].options.value': email,
                        'projects.proj.$[proj].confirmed.$[conf].options.label': email,
                        'projects.proj.$[proj].confirmed.$[conf].options.roots': 'read'
                    } 
                } as any,
                {
                    arrayFilters: [
                        { 'proj.project_name': project },
                        { 'conf.label': 'Unteamed' }
                    ]
                }
            )

            const cursor_2 = connection.collection('projects')
            const id = await cursor_2.findOne({'email': fromEmail, 'projects.title': project}, {projection:{'projects':1}})
            let id_ = id?.projects[0].id_proj
            await cursor_2.updateOne(
            { email: email },
                { 
                    $push: {
                        somelProjects: {
                            fromEmail: fromEmail,
                            project: project,
                            id_proj: id_
                        }
                    } as any
                }
            )
            await cursor_1.updateOne(
                { 
                    'projects.owner': fromEmail,
                    'projects.proj.project_name': project
                },
                { 
                    $pull: { 'projects.proj.$[proj].invited': { email: email } }
                } as any,
                {
                    arrayFilters: [
                        { 'proj.project_name': project }
                    ]
                }
            )
                return {redirect: 'http://localhost:3000/login', status_redirect: true, text:''}
            }else{
                return {text: 'Invalid code.'}
            }
        }else{
            return {text: 'Code timeout. Reload page for refresh.'}
        }
    }else{
        return {text: 'User exist.'}
    }
  }
  async checkUserInLogin(email: string){
    const client = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS || '')
    const connection = client.db('users_projects')
    const cursor = connection.collection('data')
    let resp = await cursor.findOne({email: email})
    if (resp != null){
        await client.close()
        return true
    }else{
        await client.close() 
        return {redirect: `${process.env.DOMAIN}`+'/login'}
    }
  }
  async getProjectsAll(email_: string){
    const client = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS || '')
    await client.connect()
    const connection = client.db('users_projects')
    const cursor = connection.collection('projects')
    const projects = await cursor.findOne({email: email_}, {projection: {somelProjects: 1, _id: 0}})
    if (projects != null){
        let email: any[] = []
        let projs: any[]=[]
        projects.somelProjects.forEach(element => {
            email.push(element.fromEmail)
            projs.push(element.project)
        });
        let directions:any[]= [];
        await Promise.all(
            email.map(async (element, index) => {
                let l = await cursor.findOne(
                {email: element, 'projects.title': projs[index]},
                {projection: { 'projects.$': 1, _id: 0 }}
            );
                directions.push(l)
            }))
        await client.close()
        return {directions: directions, emails: email}
    }else{
        await client.close()
        return {directions: '', emails: ''}
    }
  }
  async developers_(email: string, path: string){
    const cursor = connection.collection('projects')
    const teams = connection.collection('teams')
    // console.log(email)

    let teams_all:any[] = []
    let guest_proj: any[] = []

    if (path==='/projects/teams/modalTeams'){
        let all_ = await teams.findOne({'projects.owner': email}, {projection: {'projects.proj': 1}})
        if(all_!=null){
            all_.projects.proj.forEach((element)=>{
                let temp = {owner: email, project_name: element.project_name, confirmed: element.confirmed,
                    teams: element.team, id: element.id_proj, guest: false
                }
                teams_all.push(temp)
            })
        }

        // guest
        let guest_projects = await cursor.findOne({email: email}, {projection: {somelProjects: 1, _id: 0}})
        guest_projects = guest_projects?.somelProjects
        if (guest_projects != null){
            await Promise.all(guest_projects.map(async (fromEmail) => {
                const result = await teams.findOne(
                    {
                        'projects.owner': fromEmail.fromEmail, 
                        'projects.proj.project_name': fromEmail.project
                    },
                    {
                        projection: { 'projects.proj.$': 1, _id: 0 }
                    }
                )
                if (result!=null){
                        await result.projects.proj.forEach((element)=>{
                        let temp = {owner: fromEmail.fromEmail, project_name: element.project_name, confirmed: element.confirmed,
                            teams: element.team, id: element.id_proj, guest: true
                        }
                        guest_proj.push(temp)
                    })
                }
            }))
        }
        teams_all.push(...guest_proj)
        return [teams_all]
        
    }
    }
    async getRoles_(){
        const cursor = connection.collection('roles')
        let resp = await cursor.find({}).toArray()
        // console.log(resp)
        return resp[0].roles
    }

    async getEmails(teamName: string, owner: string){
        const cursor = connection.collection('teams')
        if (teamName === 'Unteamed'){
            let resp = await cursor.findOne({'projects.owner': owner})
            let emails_value: any[] = []
            let emails_label: any[] = []
            if (resp != null && JSON.stringify(resp.projects.proj[0]) !== '{}'){
                await Promise.all(resp.projects.proj.map((element)=>{
                    element.team.map((item)=>{
                        emails_value.push(...item.options.value)
                        emails_label.push(...item.options.label)
                    })
                }))
                emails_value = [...new Set(emails_value)]
                emails_label = [...new Set(emails_label)]
                emails_value = emails_value.flat().flat()
                emails_label = emails_label.flat().flat()
                let final_object: any[] = []
                for(let i = 0; i < emails_label.length; i++){
                    if ((emails_value[i]!=null && emails_value[i]!=undefined)&&(emails_label[i] != null || emails_label[i]!=undefined)){ 
                        final_object.push({value: emails_value[i], label: emails_label[i]})
                    }else{
                    }
                }
                return final_object
            }else{
                return null
            }
        }else{
            let resp = await cursor.findOne({'projects.owner': owner})
            let emails_value: any[] = []
            let emails_label: any[] = []
            if (resp != null){
            await Promise.all(resp.projects.proj.map((element)=>{
                element.confirmed.map((item)=>{
                    emails_value.push(...item.options.value)
                    emails_label.push(...item.options.label)
                })
                element.team.map((item)=>{
                    if(item.label!=teamName){
                        emails_value.push(...item.options.value)
                        emails_label.push(...item.options.label)
                    }
                })
            }))
            emails_value = [...new Set(emails_value)]
            emails_label = [...new Set(emails_label)]
            emails_value = emails_value.flat().flat()
            emails_label = emails_label.flat().flat()
            let final_object: any[] = []
            for(let i = 0; i < emails_label.length; i++){
                final_object.push({value: emails_value[i], label: emails_label[i]})
            }
            // console.log(final_object)
            return final_object        
        }
    }
    }
    async addMember(teamName: string, finalTeam:string,  owner: string, project_name: string, emails: any, guest: boolean, type: string, allOrNot: boolean, token: string, email: string, delete_:boolean){
        const cursor = connection.collection('teams')
        let new_emails:any = []
        let errors = ''
        if(!delete_){
            let new_:any[] = []
            emails.map(async(email_)=>{
                let p = await cursor.aggregate([
                { $unwind: '$projects' },
                { $unwind: '$projects.proj' },
                { $unwind: '$projects.proj.team' },
                { $match: {
                    'projects.owner': owner,
                    'projects.proj.project_name': project_name,
                    'projects.proj.team.label': teamName,
                    'projects.proj.team.options.value': email_.value
                }},
                { $limit: 1 }
                ]).next()
                if(p === null){
                    new_.push(email_)
                }else{
                    errors = 'This user exist in team.'
                }
            })
            new_emails = new_
            if(typeof(new_emails) === 'string'){
                new_emails = [{value: new_, label: new_, email: new_}]
            }
        }else{
            new_emails = emails
            if(typeof(new_emails) === 'string'){
                new_emails = [{value: emails, label: emails, email: emails}]
            }
        }
        const user = connection.collection('projects')
        const owner_ = await user.findOne({email: email, 'projects.title': project_name}, {projection: {projects: 1}})
    let newProjectId = ''
    if (owner_ != null){
        newProjectId = owner_.projects[0].id_proj
    }else{
        const guest_projects = await user.findOne({email: email, 'somelProjects.project': project_name, 'somelProjects.fromEmail': owner},
            {projection: {'somelProjects.id_proj':1}}
        )
        const guest_index = await user.aggregate([
            {$match: {email: email}},
            {$unwind: {path: '$somelProjects', includeArrayIndex: 'projectsIndex'}},
            {$match: {'somelProjects.fromEmail': owner}},
            {$match: {'somelProjects.project': project_name}},
            {$project: {'index': '$projectsIndex'}}
        ]
        ).toArray()
        if(guest_projects!=null){
        newProjectId = guest_projects.somelProjects[guest_index[0].index].id_proj
        }else{
            console.log('some error. addMember function')
        }
    }
        const token_ = await checkToken(email, token)
        const roots_ = await checkRoots(email, project_name, newProjectId, ['admin'])
        if(token_ != null && roots_ != 0){
            if (teamName === 'Unteamed'){
                await Promise.all(new_emails.map(async(item)=>{
                    let resp = await cursor.findOne({'projects.owner': owner, 'projects.proj.confirmed.options.email': item.value})
                    if(resp === null){
                        await cursor.updateMany(
                        {'projects.owner': owner, 'projects.proj.project_name': project_name}, 
                        {$push:{
                            'projects.proj.$.confirmed.0.options.value': item.value,
                            'projects.proj.$.confirmed.0.options.label': item.label,
                            'projects.proj.$.confirmed.0.options.email': item.value,
                            'projects.proj.$.confirmed.0.options.roots': 'read',
                        } as any})
                    }
                    let result = await cursor.aggregate(
                    [{$match: {'projects.owner': owner}},
                    {$unwind: {path: '$projects.proj', includeArrayIndex: "projIndex"}},
                    {$match: {'projects.proj.project_name': project_name}},
                    {$unwind: {path: '$projects.proj.team', includeArrayIndex: "teamIndex"}},
                    {$match: {'projects.proj.team.label': finalTeam}},
                    {$unwind: {path: '$projects.proj.team.options.value', includeArrayIndex: "emailIndex"}},
                    {$match: {'projects.proj.team.options.value': item.value}},
                    {$project: {
                        root: {$arrayElemAt: ['$projects.proj.team.options.roots', '$emailIndex']},
                        projIndex: '$projIndex',
                        teamIndex: '$teamIndex',
                        emailIndex: '$emailIndex'
                    }}
                    ]).toArray()
                if(!allOrNot){
                    let root = result[0]?.root;
                    let projIdx = result[0]?.projIndex;
                    let teamIdx = result[0]?.teamIndex;
                    let emailIdx = result[0]?.emailIndex;
                    let p = await cursor.updateOne({'projects.owner': owner,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.email.${emailIdx}`]: item.value
                    },
                        {$unset: {
                            [`projects.proj.$[].team.${teamIdx}.options.roots.${emailIdx}`]: root,
                            [`projects.proj.$[].team.${teamIdx}.options.email.${emailIdx}`]: item.value,
                            [`projects.proj.$[].team.${teamIdx}.options.value.${emailIdx}`]: item.value,
                            [`projects.proj.$[].team.${teamIdx}.options.label.${emailIdx}`]: item.value,
                        }})
                    await cursor.updateOne(
                    {
                        'projects.owner': owner,
                    },
                    {
                        $pull: {
                            [`projects.proj.$[].team.$[].options.email`]: null,
                            [`projects.proj.$[].team.$[].options.value`]: null,
                            [`projects.proj.$[].team.$[].options.label`]: null,
                            [`projects.proj.$[].team.$[].options.roots`]: null
                        } as any
                    }
                );
                }else{
                    result.map(async (element)=>{
                        let root: string = element.root
                        let projIdx: string = element.projIndex
                        let teamIdx: string = element.teamIndex
                        let emailIdx: string = element.emailIndex
                    
                    await cursor.updateOne({'projects.owner': owner,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.email.${emailIdx}`]: item.value
                    },
                    {$unset: {
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.roots.${emailIdx}`]: root,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.email.${emailIdx}`]: item.value,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.value.${emailIdx}`]: item.value,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.label.${emailIdx}`]: item.value,
                    }})
                    await cursor.updateOne(
                    {
                        'projects.owner': owner,
                    },
                    { 
                        $pull: {
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.email`]: null,
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.value`]: null,
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.label`]: null,
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.roots`]: null
                        } as any
                    }
                    );
                    })
                }
            }))
            }else{
                await new_emails.map(async(item)=>{
                    let result = await cursor.aggregate([{$match: {'projects.owner': owner}},
                        {$unwind: {path: '$projects.proj', includeArrayIndex: 'projIndex'}},
                        {$unwind: {path: `$projects.proj.confirmed`, includeArrayIndex: "teamIndex"}},
                        {$unwind: {path: `$projects.proj.confirmed.options.email`, includeArrayIndex: "emailIndex"}},
                        {$match: {[`projects.proj.confirmed.options.email`]: item.value}},
                        {$project: {
                            root: {$arrayElemAt: [`$projects.proj.confirmed.options.roots`, '$emailIndex']},
                            projIndex: '$projIndex',
                            teamIndex: '$teamIndex',
                            emailIndex: '$emailIndex'
                        }}
                        ]).toArray()
                        let root = ''
                        let projIdx = ''
                        let teamIdx = ''
                        let emailIdx = ''
                        if (result !=null && result.length >0){
                            root = result[0]?.root;
                            projIdx = result[0]?.projIndex;
                            teamIdx = result[0]?.teamIndex;
                            emailIdx = result[0]?.emailIndex;
                            await cursor.updateOne(
                                {
                                    'projects.owner': owner,
                                    'projects.proj.team.label': teamName
                                },
                                {
                                    $push: {
                                        [`projects.proj.$[].team.$[team].options.value`]: item.value,
                                        [`projects.proj.$[].team.$[team].options.label`]: item.label,
                                        [`projects.proj.$[].team.$[team].options.email`]: item.value,
                                        [`projects.proj.$[].team.$[team].options.roots`]: 'read',
                                    }as any
                                },
                                {
                                    arrayFilters: [
                                        { "team.label": teamName }
                                    ]
                                }
                            );
                            await cursor.updateOne({'projects.owner': owner,
                                [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.email.${emailIdx}`]: item.value
                            },
                            {$unset: {
                                [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.roots.${emailIdx}`]: root,
                                [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.email.${emailIdx}`]: item.value,
                                [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.value.${emailIdx}`]: item.value,
                                [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.label.${emailIdx}`]: item.value,
                            }})
                            await cursor.updateOne(
                            {
                                'projects.owner': owner,
                            },
                            { 
                                $pull: {
                                    [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.email`]: null,
                                    [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.value`]: null,
                                    [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.label`]: null,
                                    [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.roots`]: null
                                } as any
                            }
                            );
                            
                        }else{
                            await cursor.updateOne(
                                {
                                    'projects.owner': owner,
                                    'projects.proj.team.label': teamName
                                },
                                {
                                    $push: {
                                        [`projects.proj.$[].team.$[team].options.value`]: item.value,
                                        [`projects.proj.$[].team.$[team].options.label`]: item.label,
                                        [`projects.proj.$[].team.$[team].options.email`]: item.value,
                                        [`projects.proj.$[].team.$[team].options.roots`]: 'read',
                                    }as any
                                },
                                {
                                    arrayFilters: [
                                        { "team.label": teamName }
                                    ]
                                }
                            );
                        }
                })
            }
            return {error: errors}
        }else{
            return {error: 'You don`t have permissions.'}
        }
    }
    async deleteMember(teamName: string, owner: string, changedEmail:string, project_name: string, email:string, token:string){
    const cursor = connection.collection('teams')
    const user = connection.collection('projects')
    const owner_ = await user.findOne({email: email, 'projects.title': project_name}, {projection: {projects: 1}})
    let newProjectId = ''
    if (owner_ != null){
        newProjectId = owner_.projects[0].id_proj
    }else{
        const guest_projects = await user.findOne({email: email, 'somelProjects.project': project_name, 'somelProjects.fromEmail': owner},
            {projection: {'somelProjects.id_proj':1}}
        )
        const guest_index = await user.aggregate([
            {$match: {email: email}},
            {$unwind: {path: '$somelProjects', includeArrayIndex: 'projectsIndex'}},
            {$match: {'somelProjects.fromEmail': owner}},
            {$match: {'somelProjects.project': project_name}},
            {$project: {'index': '$projectsIndex'}}
        ]
        ).toArray()
        if(guest_projects!=null){
        newProjectId = guest_projects.somelProjects[guest_index[0].index].id_proj
        }
        // else{
        //     console.log('guest project not find.')
        // }
    }
    // console.log(newProjectId, owner, changedEmail)
    const token_ = await checkToken(email, token)
    const roots_ = await checkRoots(email, project_name, newProjectId, ['admin'])
    try {
        if (token_ != null && roots_ != 0){
            if(teamName === 'Unteamed'){
                // console.log('Unteamed! 628')
                let result = await cursor.aggregate(
                [{$match: {'projects.owner': owner}},
                {$unwind: {path: '$projects.proj', includeArrayIndex: "projIndex"}},
                {$match: {'projects.proj.project_name': project_name}},
                {$unwind: {path: '$projects.proj.confirmed', includeArrayIndex: "teamIndex"}},
                {$unwind: {path: '$projects.proj.confirmed.options.email', includeArrayIndex: "emailIndex"}},
                {$match: {'projects.proj.confirmed.options.email': changedEmail}},
                {$project: {
                    root: {$arrayElemAt: ['$projects.proj.confirmed.options.roots', '$emailIndex']},
                    projIndex: '$projIndex',
                    teamIndex: '$teamIndex',
                    emailIndex: '$emailIndex'
                }}
                ]).toArray()
                // console.log(result)
                let root = result[0]?.root;
                let projIdx = result[0]?.projIndex;
                let teamIdx = result[0]?.teamIndex;
                let emailIdx = result[0]?.emailIndex;
                // console.log(root, projIdx, teamIdx, emailIdx, 648)
                await cursor.updateOne(
                {
                    'projects.owner': owner,
                    [`projects.proj.${projIdx}.project_name`]: project_name
                },
                {
                    $unset: {
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.email.${emailIdx}`]: changedEmail,
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.value.${emailIdx}`]: changedEmail,
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.label.${emailIdx}`]: changedEmail,
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.roots.${emailIdx}`]: root
                    } as any
                })
                await cursor.updateOne(
                {
                    'projects.owner': owner,
                    [`projects.proj.${projIdx}.project_name`]: project_name
                },
                {
                    $pull: {
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.email`]: null,
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.value`]: null,
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.label`]: null,
                        [`projects.proj.${projIdx}.confirmed.${teamIdx}.options.roots`]: null
                    } as any
                }
                );

                let allEntries = await cursor.aggregate([
                    {$match: {'projects.owner': owner, 'projects.proj.project_name': project_name}},
                    {$unwind: {path: '$projects.proj', includeArrayIndex: "projIndex"}},
                    {$match: {'projects.proj.project_name': project_name}},
                    {$unwind: {path: '$projects.proj.team', includeArrayIndex: "teamIndex"}},
                    {$unwind: {path: '$projects.proj.team.options.email', includeArrayIndex: "emailIndex"}},
                    {$match: {'projects.proj.team.options.email': changedEmail}},
                    {$project: {
                        projIndex: '$projIndex',
                        teamIndex: '$teamIndex',
                        emailIndex: '$emailIndex',
                        teamLabel: '$projects.proj.team.label'
                    }}
                ]).toArray()
                if (allEntries.length>0){
                await Promise.all(allEntries.map(async(element)=>{
                    let root: string = element.root
                    let projIdx: string = element.projIndex
                    let teamIdx: string = element.teamIndex
                    let emailIdx: string = element.emailIndex
                    
                    await cursor.updateOne({'projects.owner': owner,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.email.${emailIdx}`]: changedEmail
                    },
                    {$unset: {
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.roots.${emailIdx}`]: root,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.email.${emailIdx}`]: changedEmail,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.value.${emailIdx}`]: changedEmail,
                        [`projects.proj.${projIdx}.team.${teamIdx}.options.label.${emailIdx}`]: changedEmail,
                    }})
                    await cursor.updateOne(
                    {
                        'projects.owner': owner,
                    },
                    { 
                        $pull: {
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.email`]: null,
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.value`]: null,
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.label`]: null,
                            [`projects.proj.${projIdx}.team.${teamIdx}.options.roots`]: null
                        } as any
                    })
                }))
            }
            }
        return {error: ''}
    }else{
        return {error: "You don`t have permissions."}
    }
    }
    catch(e){
        return {error: String(e)}
    }
    }
    async editTeam(title: string, oldTitle: string, owner: string, guest: boolean, projectName: string, token:string, email:string){
        const cursor = connection.collection('teams')
        const user = connection.collection('projects')
        const owner_ = await user.findOne({email: email, 'projects.title': projectName}, {projection: {projects: 1}})
        let newProjectId = ''
        if (owner_ != null){
        newProjectId = owner_.projects[0].id_proj
        }else{
            const guest = await user.findOne({email: email, 'somelProjects.project': projectName, 'somelProjects.fromEmail': owner},
                {projection: {projects:1}}
            )
            if(guest!=null){
            newProjectId = guest.projects[0].id_proj
            }else{
                console.log('some error.')
            }
        }
        const token_ = await checkToken(owner, token)
        const roots_ = await checkRoots(owner, projectName, newProjectId, ['admin'])
        if(title === oldTitle) return {error: 'Make some changes for edit.'}
        if(token_!=null && roots_!=0 && oldTitle != 'Unteamed'){
            let resp = await cursor.findOne({'projects.owner': owner,
            'projects.proj.project_name': projectName,
            'projects.proj.team.label': oldTitle})
            if (resp){
                let l = await cursor.updateOne(
                    { 'projects.owner': owner, 'projects.proj.project_name': projectName },
                    { $set: { 'projects.proj.$[proj].team.$[team].label': title } },
                    {
                        arrayFilters: [
                        { 'proj.project_name': projectName },
                        { 'team.label': oldTitle }
                        ]
                    }
                )
            }
            return {error: ''}
        }else{
            return {error: "You don`t have permissions."}
        }
    }
    async editRoles(project: string, teamName: string, owner: string, roles: string, oldRole: string, email:string, guest: boolean, emailIndex: string, token){
        const cursor = connection.collection('teams')
        const user = connection.collection('projects')
        const owner_ = await user.findOne({email: email, 'projects.title': project}, {projection: {projects: 1}})
        let newProjectId = ''
        if (owner_ != null){
        newProjectId = owner_.projects[0].id_proj
        }else{
            const guest = await user.findOne({email: email, 'somelProjects.project': project, 'somelProjects.fromEmail': owner},
                {projection: {projects:1}}
            )
            if(guest!=null){
            newProjectId = guest.projects[0].id_proj
            }else{
                console.log('some error.')
            }
        }
        const token_ = await checkToken(owner, token)
        const roots_ = await checkRoots(owner, project, newProjectId, ['admin'])
        roles = roles?.toLowerCase() ?? null
        if(token_!=null && roots_ != 0){
            if (teamName !== 'Unteamed') {
                const l = await cursor.updateOne(
                {
                    'projects.owner': owner,
                    'projects.proj.project_name': project,
                    'projects.proj.team.label': teamName
                },
                {
                    $set: {
                        [`projects.proj.$[proj].team.$[team].options.roots.${emailIndex}`]: roles
                    }
                },
                {
                    arrayFilters: [
                        { 'proj.project_name': project },
                        { 'team.label': teamName }
                    ]
                }
            )
                return {error: ''}
            }else{
                return {error: 'You can`t do this.'}
            }
        }else{
            return {error: 'You can`t do this.'}
        }
    }
    async deleteTeam(teamName: string, projectName: string, owner: string, token:string){
        const cursor = connection.collection('teams')
        const user = connection.collection('projects')
        const data = connection.collection('data')
        const projectId = await user.findOne({email: owner, 'projects.title': projectName}, {projection: {projects: 1}})
        let newProjectId = projectId
        if (projectId!=null){
            newProjectId = projectId.projects[0].id_proj
        }
        const token_ = await checkToken(owner, token)
        const roots_ = await checkRoots(owner, projectName, newProjectId)
        if(token_ != null && roots_ != 0){
            const r = await cursor.updateOne(
                { 
                    'projects.owner': owner,
                    'projects.proj.project_name': projectName,
                    'projects.proj.team.label': teamName
                },
                { 
                    $pull: { 
                        'projects.proj.$[proj].team': { label: teamName }
                    } as any
                },
                {
                    arrayFilters: [
                        { 'proj.project_name': projectName }
                    ]
                }
            )
            const l = await data.updateMany({'email':owner, 'projects.title_proj': projectName},
                {$unset: {
                    [`projects.$[pr].blocks.$[].tasks.developers.$[].${teamName}`]: ""
                }as any
            },
            {
                arrayFilters: [{'pr.title_proj': projectName}]
            }
            )
            return {error: ''}
        }else{
            return{error: 'You don`t have permissions for this action.'}
        }
    }
    async getProjects_create(owner: string){
        const cursor = connection.collection('teams')
        let labels = await cursor.findOne({'projects.owner': owner}, {projection: {'projects.proj.project_name': 1}})
        let proj_names: object[]= []
        if (labels!=null && JSON.stringify(labels.projects.proj[0])!='{}') {
            labels.projects.proj.map((item)=>{
                proj_names.push({label: item.project_name, value: item.project_name})
            })
            return {projects: proj_names, error: ''}
        }else{
            return {projects: {label:'', value:''}, error: 'You don`t have projects'}
        }
    }
    async createTeam(owner: string, title: string, project: string, members: any[], token:string){
        const cursor = connection.collection('teams')
        const resp = await cursor.findOne({
            'projects.owner': owner,
            'projects.proj.project_name': project['label'] ,
            'projects.proj.team.label': title
        })
        const token_ = await checkToken(owner, token)
        if(token_!=null){
        if(resp===null){
            let res = await cursor.updateOne(
                { 
                    'projects.owner': owner, 
                    'projects.proj.project_name': project['label'] 
                },
                { 
                    $push: {
                        'projects.proj.$.team': {
                            label: title, 
                            options: {
                                value: [], 
                                label: [], 
                                email: [], 
                                roots: []
                            }
                        }
                    } as any
                }
            )
            if(res!=null){
                members.map(async(element)=>{
                    await cursor.updateOne({'projects.owner': owner, 'projects.proj.project_name': project['label'],
                        'projects.proj.team.label': title
                    },
                    {$push:{
                        'projects.proj.$[project].team.$[labelProject].options.value': element.value,
                        'projects.proj.$[project].team.$[labelProject].options.label': element.value,
                        'projects.proj.$[project].team.$[labelProject].options.email': element.value,
                        'projects.proj.$[project].team.$[labelProject].options.roots': 'read'
                    }as any},
                    {arrayFilters: [{'project.project_name': project['label']}, {'labelProject.label': title}]}
                )
                })
            }
            return {error: ''}
        }else{
            return {error: 'This team exists! Take another.'}
        }}else{
            return{error: "You don`t have permissions. Go to register or login."}
        }
    }
    async getTeams(owner: string, project: string){
        const cursor = connection.collection('projects')
        let resp = await cursor.findOne({'email': owner, 'projects.title': project})
        let guest = false
        let teams_: object[] = []
        if (resp === null){
            guest=true
            let final_owner = await cursor.findOne({email: owner, 'somelProjects.project': project}, {projection: {'somelProjects.fromEmail': 1}})
            if(final_owner != null){
                let f = final_owner.somelProjects[0].fromEmail
                let teams = connection.collection('teams')
                let r = await teams.findOne({'projects.owner': f, 
                    'projects.proj.project_name': project}, 
                    {projection: {'projects.proj.team': 1,'projects.proj.project_name': 1, _id: 0}})
                if (r!=null){
                    r.projects.proj.map((team)=>{
                        if(team.project_name === project){
                            team.team.map((i)=>{
                                // console.log(i.label)
                                teams_.push({value: i.label, label: i.label})
                            })
                        }
                    })
                }
            }
        }else{
            let teams = connection.collection('teams')
            let r = await teams.findOne({'projects.owner': owner, 
                'projects.proj.project_name': project}, 
                {projection: {'projects.proj.team': 1,'projects.proj.project_name': 1, _id: 0}})
            if (r!=null){
                r.projects.proj.map((team)=>{
                    if(team.project_name === project){
                        team.team.map((i)=>{
                            // console.log(i.label)
                            teams_.push({value: i.label, label: i.label})
                        })
                    }
                })
            }
        }
        return {teams: teams_}
    }
    async deleteBlock(email: string, blockName: string, project: string, projectId: string, token:string){
    // const cursor = connection.collection('teams')
        const user = connection.collection('projects')
        // console.log(email, blockName, project, projectId, token)
        const owner_ = await user.findOne({email: email, 'projects.title': project}, {projection: {projects: 1}})
        let newProjectId = projectId
    if (owner_ != null){
        newProjectId = owner_.projects[0].id_proj
    }
        const token_ = await checkToken(email, token)
        const roots_ = await checkRoots(email, project, newProjectId, ['admin'])
        if(token_ != null && roots_ != 0){
            const cursor = connection.collection('data')
            const resp = await cursor.updateOne(
                {
                email: email,
                'projects.title_proj': project,
                },
                {
                $pull: {
                    'projects.$.blocks': {
                    method: blockName
                    }
                } as any
                }
            );
    
        const blocks_ = await this.getBlocks.getBlocksFunction(email, project);
        this.taskGateway.upBlocks({payload: blocks_}, email, token, projectId)
        return []
    }else{
        return ["You don`t have permissions."]
    }
}
    async createTask(email:string, project: string, title: string, direction: string, developers: any, deadline: any, block: string, projectId: any, token: string){
        const cursor = connection.collection('data')
        const token_ = await checkToken(email, token)
        const id = new ObjectId(projectId)
        const roots_ = await checkRoots(email, project, projectId, ['admin'])
        const errors:string[] = []
        if(title == undefined && direction == undefined && deadline == undefined){return {errors: 'Some undefined.'}}
        if(token_ != null && roots_ != 0){
            const validation = checkToken(email, token)
            if(validation != null){
                const newTitle = title.trim()
                if(newTitle == ''){
                    errors.push('Title can`t be empty!')
                }else{
                    const titleCheck = await cursor.findOne({
                    'projects.id_proj': id, 
                    'projects.blocks.method': block,
                    'projects.blocks.tasks.title': { $in: [newTitle] }
                    })
                    if (titleCheck != null){
                        errors.push('This title name exist! Please, select another.')
                    }else{
                        const newDirection = direction.trim()
                        if (typeof(newDirection) === 'string' && newDirection != ''){
                            let newDevelopers: any = {}
                            if(developers && developers.value.length > 0 && developers.label.length>0 && developers != undefined && developers.value != undefined && developers.label!=undefined){
                                developers.value.forEach((i) => {
                                    newDevelopers[i] = [];
                                });
                                let checkDev = developers.value.map((i)=>{return i})
                                const teams = connection.collection('teams')
                                checkDev.map(async(i)=>{
                                    let teamsFind = await teams.findOne({'projects.proj.id_proj': id, 'projects.proj.team.label': i})
                                    if(teamsFind === null){
                                        errors.push("This team doesn`t exists. Please check your selection.")
                                    }
                                })
                            }
                                if(!errors.includes("This team doesn`t exists. Please check your selection.")){
                                    if(deadline.firstDate === '' || deadline.secondDate === ''){
                                        errors.push('Please, check dates.')
                                    }else{
                                        await cursor.updateOne(
                                            { 'projects.id_proj': id },
                                            {
                                                $push: {
                                                'projects.$[proj].blocks.$[block].tasks.title':newTitle,
                                                'projects.$[proj].blocks.$[block].tasks.direction':newDirection,
                                                'projects.$[proj].blocks.$[block].tasks.isChecked': false
                                                } as any
                                            },
                                            {
                                                arrayFilters: [
                                                { 'proj.title_proj': project },
                                                { 'block.method': block }
                                                ]
                                            }
                                        )

                                        if(JSON.stringify(newDevelopers) !== '{}'){
                                            await cursor.updateOne({'projects.id_proj':id}, {$push: {[`projects.$[proj].blocks.$[block].tasks.developers`]: newDevelopers} as any},
                                                {arrayFilters: [{'proj.title_proj':project}, {'block.method':block}]}
                                            )
                                        }
                                        let index = await cursor.aggregate([
                                            {$unwind: '$projects'},
                                            {$match: {'projects.id_proj': id}},
                                            {$unwind: '$projects.blocks'},
                                            {$match: {'projects.blocks.method': block}},
                                            { $unwind: { path: '$projects.blocks.tasks.title', includeArrayIndex: 'indexEmail' } },
                                            { 
                                                $project: {
                                                index: '$indexEmail',
                                                _id: 0
                                                } 
                                            },
                                        ]).toArray()

                                        const maxIndex = Math.max(...index.map(item => item.index));
                                        await cursor.updateOne(
                                            { 'projects.id_proj': id },
                                            {
                                                $set: {
                                                    [`projects.$[proj].blocks.$[block].tasks.deadline.${maxIndex}`]: {
                                                        start: deadline.start,
                                                        end: deadline.end
                                                    }
                                                } as any
                                            },
                                            {
                                                arrayFilters: [
                                                    { 'proj.title_proj': project },
                                                    { 'block.method': block }
                                                ]
                                            }
                                        )
                                    }
                                }
                        }else{
                            errors.push('Description can`t be empty.')
                        }
                    }
                }
        const tasks = await getBlocksFunction_socket(email, project, projectId)
        // console.log(tasks, 1127)
        this.taskGateway.updateTasks(tasks);
        return errors
        }
    }else{
        return ["You don`t have permissions!"]
    }
}
   
    async updateTask(email:string, project: string, block: string, task: string, title: string, description: string, developers: any, date: object, projectId: string, token: string){
        const token_ = await checkToken(email, token)
        const roots_ = await checkRoots(email, project, projectId, ['admin'])
        // if (!Object.values(changed).some(value => value === true)){
        //     console.log()
        // }
        if(token_ != null && roots_ != 0){
        const errors: string[] = []
        let equals:boolean[] = []
        let error = ''
        if (roots_ === 1 && token_!=null){
            const cursor = connection.collection('data')
            let resp = await cursor.aggregate([
                {$match: {'email': email}},
                {$unwind: '$projects'},
                {$match: {'projects.id_proj': new ObjectId(projectId)}},
                {$unwind: '$projects.blocks'},
                {$match: {'projects.blocks.method': block}},
                {$project: {tasks: '$projects.blocks.tasks', _id: 0}}
            ]).toArray()
            let tasks = resp[0]?.tasks
            if (resp.length === 0){
                let resp_ = await cursor.aggregate([
                    { $match: { 'projects.id_proj': new ObjectId(projectId) } },
                    { $unwind: '$projects' },
                    { $unwind: '$projects.blocks' },
                    { $match: { 'projects.blocks.method': block } },
                    { $project: { tasks: '$projects.blocks.tasks', _id: 0 } }
                ]).toArray();
                tasks = resp_[0]?.tasks
            }
            let keys = Object.keys(tasks)
            let deadline = date
            const newDev = {}
            developers.value.map((i)=>{
                Object.assign(newDev, {[i]:['']}) 
            })
            let values = [title, description, newDev, deadline]
            const upPromisses = keys.filter(key => key !== 'isChecked').map(async(i, index) => {
                const oldVal = tasks[i]?.[task];
                const newVal = values[index];
                if (oldVal === undefined && newVal === undefined) return;
                const isEqual = typeof oldVal === 'object' 
                    ? JSON.stringify(oldVal) === JSON.stringify(newVal)
                    : oldVal === newVal;
                    // console.log(isEqual, oldVal, newVal, 1191)
                if (!isEqual) {
                    await cursor.updateOne(
                        { 'projects.id_proj': new ObjectId(projectId) },
                        { 
                            $set: { [`projects.$[proj].blocks.$[bl].tasks.${i}.${task}`]: newVal }
                        },
                        {
                            arrayFilters: [
                                { 'proj.title_proj': project },
                                { 'bl.method': block }
                            ]
                        }
                    );
                    // console.log(newVal, 1201)
                    equals.push(false)
                }else{
                    equals.push(isEqual)
                }
            }
        )
        await Promise.all(upPromisses)
        if (Object.values(equals).every(value => value === true)){
            errors.push('Made some changes.')
        }
        }else{
            errors.push("You don`t have permissions.")
        }
        
        errors.push(error)
        const tasks = await getBlocksFunction_socket(email, project, projectId)
        this.taskGateway.updateTasks(tasks);
        return errors
    }
    }
    async deleteTask(email:string, projectId:string, project:string, block:string, task_id:string, token:string){
        // console.log(email, projectId, block, task_id, 1111)
        const id = new ObjectId(projectId)
        // const cursor = connection.collection('teams')
        const user = connection.collection('projects')
        const projectId_ = await user.findOne({email: email, 'projects.title': project}, {projection: {projects: 1}})
        let newProjectId = projectId
        if (projectId_!=null){
            newProjectId = projectId_.projects[0].id_proj
        }
        const token_ = await checkToken(email, token)
        const roots_ = await checkRoots(email, project, newProjectId, ['admin'])

        if(token_ != null && roots_ != 0){
        const errors: string[] = []
        if (roots_ === 1 && token_!=null){
            const cursor = connection.collection('data')
            let res = await cursor.updateOne(
            { 'projects.id_proj': id },
            { 
                $unset: {
                    [`projects.$[proj].blocks.$[bl].tasks.title.${task_id}`]: "",
                    [`projects.$[proj].blocks.$[bl].tasks.direction.${task_id}`]: "",
                    [`projects.$[proj].blocks.$[bl].tasks.developers.${task_id}`]: "",
                    [`projects.$[proj].blocks.$[bl].tasks.deadline.${task_id}`]: "",
                    [`projects.$[proj].blocks.$[bl].tasks.isChecked.${task_id}`]: ""
                }
            },
            {
                arrayFilters: [
                    { 'proj.id_proj': id },
                    { 'bl.method': block }
                ]
            }
        )
        await cursor.updateOne(
            { 'projects.id_proj': id },
            { 
                $pull: {
                    [`projects.$[proj].blocks.$[bl].tasks.title`]: null,
                    [`projects.$[proj].blocks.$[bl].tasks.direction`]: null,
                    [`projects.$[proj].blocks.$[bl].tasks.developers`]: null,
                    [`projects.$[proj].blocks.$[bl].tasks.deadline`]: null,
                    [`projects.$[proj].blocks.$[bl].tasks.isChecked`]: null

                }as any
            },
            {
                arrayFilters: [
                    { 'proj.id_proj': id },
                    { 'bl.method': block }
                ]
            }
        )
            errors.push('')
        }else{
            errors.push("You don`t have permissions.")
        }
        const tasks = await getBlocksFunction_socket(email, project, projectId)
        this.taskGateway.updateTasks(tasks)
        return errors
    }
}
    async taskDone(email:string, project:string, projectId:string, block:string, task_id:string, checkboxStatus:boolean, token:string){
        const cursor = connection.collection('data')
        let newProjectId = new ObjectId(projectId)
        const token_ = await checkToken(email, token)
        const roots_ = await checkRoots(email, project, newProjectId, ['write', 'admin'])
        if(token_ != null && roots_ != 0){
            await cursor.updateOne(
                { 'projects.id_proj': newProjectId },
                {
                    $set: {
                        [`projects.$[proj].blocks.$[block].tasks.isChecked.${task_id}`]: checkboxStatus
                    }
                },
                {
                    arrayFilters: [
                        { 'proj.id_proj': newProjectId },
                        { 'block.method': block }
                    ]
                }
            )
            return {error: ''}
        }else{
            return {error: "You don`t have permissions."}
        }
    }
    async deleteTeamFromTask(email:string, project: string, block:string, task:string, team:any, tokenUnsign:string, projectId:string, emp:string){
        const projectId_ = new ObjectId(projectId)
        const roots = await checkRoots(email, project, projectId_, ['admin'])
        const token = await checkToken(email, tokenUnsign)
        if(token !=null && roots != 0){
            const data_teams = connection.collection('data')
            const blocksIndex = await data_teams.aggregate([
            {
                $unwind: {path: '$projects', includeArrayIndex: 'projectsIndex'}, 
            },
            {
                $match: {'projects.id_proj': projectId_}
            },
            {
                $match: {'projects.title_proj': project}
            },
            {
                $unwind: {path: '$projects.blocks', includeArrayIndex: 'blocksIndex'}
            },
            {$match: {'projects.blocks.method': block}}
        ]).toArray()
        const taskIndex = parseInt(task);
        // await data_teams.findOne(
        // {[`projects.${blocksIndex[0].projectsIndex}.blocks.${blocksIndex[0].blocksIndex}.tasks.developers.${taskIndex}.${emp}`]: 
        // {
        //     $exists: true
        // }
        // }
        // )
        await data_teams.updateOne(
            {
                'projects.id_proj': projectId_,
                'projects.title_proj': project
            },
            {
                $unset: {
                    [`projects.${blocksIndex[0].projectsIndex}.blocks.${blocksIndex[0].blocksIndex}.tasks.developers.${taskIndex}.${emp}`]: ""
                }
            }
        )
        return {error: ''}
        }else{
            return {error: 'You don`t have permissions.'}
        }
    }
    async accountData(email:any, token: any){
        const cursor_projects = connection.collection('projects')
        const cursor_teams = connection.collection('teams')
        const tokenRight = await checkToken(email, token)
        if(tokenRight!=null){
            let countTeams = 0
            let countProjects = 0
            let resp = await cursor_projects.findOne({email: email}, {projection: {projects: 1}})
            if (resp != null){
                countProjects = resp.projects.length
            }
            let resp_ = await cursor_teams.findOne({'projects.owner': email}, {projection: {'projects.proj.team': 1}})
            if(resp_ != null && JSON.stringify(resp_.projects.proj[0]) !== '{}'){
                resp_!.projects.proj.map((i)=>{
                    countTeams+=i.team.length
                })
            }   
            return [countTeams, countProjects]
        }else{
            return ['error', '/main_register']
        }
    }
    async valid_data(email: string){
    const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
    const isValid = email_validation.test(email) 
    if (!isValid) {
        return {error: 'Email template wrong. Try "example@gmail.com".'}
    }else{
        return {error: ''}
    }
}
    async editOwner(email:string, newEmail: string, token:string){
        const cursor_projects = connection.collection('projects')
        const cursor_data = connection.collection('data')
        const cursor_teams = connection.collection('teams')
        const cursor_login = connection_login.collection('login')
        const tokenRight = await checkToken(email, token)
        const resp = await this.checkUserInLogin(newEmail)
        const valid_ = await this.valid_data(newEmail)
        if(tokenRight!=null && resp != true && valid_.error === ''){
            await cursor_projects.updateOne({email: email}, {$set: {email: newEmail}})
            await cursor_projects.updateOne({'somelProjects.fromEmail': email}, {$set: {'somelProjects.$.fromEmail': newEmail}})
            await cursor_data.updateOne({email: email}, {$set: {email: newEmail}})
            await cursor_teams.updateOne({'projects.owner': email}, {$set: {'projects.owner': newEmail}})
            await cursor_login.updateOne({email: email}, {$set: {email: newEmail}})
        }else{
            if(valid_.error !== ''){
                return {error: valid_.error, redirect: null}
            }else if(resp===true){
                return {error: 'This email already exists. Try another.', redirect: null}
            }else{
                return {redirect: '/login', error: null}
            }
        }
    }
    async deleteAccount(email:string, token: string){
        const tokenUnsign = checkToken(email, token)
        const cursor_projects = connection.collection('projects')
        const cursor_data = connection.collection('data')
        const cursor_teams = connection.collection('teams')
        const cursor_login = connection_login.collection('login')
        if(tokenUnsign != null){
            await cursor_projects.deleteMany({email: email})
            await cursor_projects.updateOne({'somelProjects.fromEmail': email}, 
            { $pull: { somelProjects: { fromEmail: email } } as any})
            await cursor_data.deleteMany({email: email})
            await cursor_teams.deleteMany({'projects.owner': email})
            await cursor_login.deleteOne({email: email})
            return {redirect: '/main_register', error: null}
        }else{
            return {redirect: '/login', error: null}
        }
    }
    async checkLogin(email:string, token:string){
        let token_ = await checkToken(email, token)
        if(token_!=null){
            return true
        }else{
            return false
        }
    }
}
@Injectable()
export class EmailsService implements OnModuleInit {
    constructor(
        private readonly taskGateway: TaskGateway,
    ) {}

    async onModuleInit() {
        const collection = connection.collection('teams');
        collection.watch([], { fullDocument: 'updateLookup' }).on('change', async (change) => {
            if (change.operationType != 'insert' &&
                change.operationType != 'update') {
            return;
            }
            const owner = change.fullDocument?.projects?.owner;
            if (owner) {
                const emails = await getEmails_forSockets('Unteamed', owner);
                this.taskGateway.server.to(owner).emit('emailsUpdated', emails);
                const projects = await getProjects_create_forSocket(owner)
                this.taskGateway.server.to(owner).emit('projectAllUpdated', projects)
            }
        });
        const projects = connection.collection('projects')
        projects.watch([], { fullDocument:'updateLookup' }).on('change', async(change)=>{
            if (change.operationType != 'insert' &&
                change.operationType != 'update') {
            return;
            }
            const owner = change.fullDocument?.email;
            if (owner) {
                const projects = await getProjectsAll_socket(owner)
                this.taskGateway.server.to(owner).emit('projectsGet', projects)
                // const emails = await getEmails_forSockets('Unteamed', owner);
                // this.taskGateway.server.to(owner).emit('emailsUpdated', emails);
                // const projects = await getProjects_create_forSocket(owner)
                // this.taskGateway.server.to(owner).emit('projectAllUpdated', projects)
            }
        })
        const blocks = connection.collection('data')
        blocks.watch([], {fullDocument: 'updateLookup'}).on('change', async(change)=>{
            if (change.operationType != 'insert' &&
                change.operationType != 'update') {
            return;
            }
            const owner = change.fullDocument?.email
            if(owner){
                // updateTasks
                // this.taskGateway.handleConnection()
                // let resp = await getBlocksFunction_socket()
                // this.taskGateway.server.to(owner).emit('updateTasks')
            }
        })
        const deleteTeam = connection.collection('teams')
        deleteTeam.watch([], {fullDocument: 'updateLookup'}).on('change', async(change)=>{
            if(change.operationType!='insert' && change.operationType!='update'){return }
            const owner = change.fullDocument?.projects.owner
            if(owner){
                const developers = await developers_forSockets(owner, '/projects/teams/modalTeams')
                this.taskGateway.server.to(owner).emit('updateTeams', developers)
                // const getDevelopersForTeams = await getEmails_forSockets()
                if (change.operationType === 'update') {
                    const updatedFields = change.updateDescription.updatedFields;
                }
            }
        })

    }
}