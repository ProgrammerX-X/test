import { Injectable, Param } from '@nestjs/common';
import { CreateProPanelHandlerDto } from './dto/create-pro-panel_handler.dto';
import { UpdateProPanelHandlerDto } from './dto/update-pro-panel_handler.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { User } from './user.schema';
import { GetBlock, blockSchema, GetProjects, blockSchemaGetter } from './schema/pro-panel_handler.schema';
import { threadId } from 'worker_threads';
import type { Request, Response } from 'express';
import { TaskGateway } from '../sender/task.gateway';
// import {connection} from 'mongoose'
import {connection} from '../db'
import { MongoClient, UpdateFilter  } from 'mongodb'
import { checkRoots, checkToken } from 'src/sender/access';
import { OnModuleInit } from '@nestjs/common';
import {getAllProjectsSocket} from './socketHandler'

const { ObjectId } = require('mongodb');
@Injectable()
export class ProPanelHandlerService {
  constructor(
    @InjectModel(GetBlock.name) private dataBase: Model<GetBlock>,
    @InjectModel(GetProjects.name) private dataBase_: Model<GetProjects>,
    private taskGateway: TaskGateway
  ) {}

  async getBlocksFunction(email: string, project: string) {
  const result = await this.dataBase.aggregate([
    { $match: { "email": email } },
    { $unwind: "$projects" },
    { $match: { "projects.title_proj": project } }
  ]);
  let res = String(result)
  if(res==''){
    const client = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS || '')
    const connection = client.db('users_projects')
    const cursor = connection.collection('projects')
    let resp = await cursor.findOne({email: email, 'somelProjects.project': project}, {projection: {'somelProjects.fromEmail': 1}})
    if (resp!=null){
      const owner = resp.somelProjects[0].fromEmail
      let blocks_ = await this.dataBase.aggregate([
    { $match: { "email": owner } },
    { $unwind: "$projects" },
    { $match: { "projects.title_proj": project } }
  ]);
    await client.close()
      return blocks_[0].projects
    }
    else{
      let newProject = decodeURIComponent(project)
      if(newProject!=null && newProject!=undefined && newProject!=''){
        const projectOwner = await this.dataBase_.findOne({'email': email, 'projects.title': newProject})
        if(projectOwner==null){
          const projectOwner = await this.dataBase_.findOne({'email': email, 'somelProjects.project': newProject})
          if(projectOwner === null){
            return "redirect"
          }else{
            await client.close()
            return await this.getBlocksFunction(email, newProject)
          }
        }        
        else{
          await client.close()
          return await this.getBlocksFunction(email, newProject)
        }
      }else{
        await client.close()
        return "redirect"
      }
    }
  }else{
    const blocks = result;
    return blocks[0].projects;
  }
  }
  
  async getAllProjects(email:string){
    const user = connection.collection('projects')
    const result = await user.findOne({email: email})
    let emails_:string[] = []
    if (result!=null){
      for(let i = 0; i < result.projects.length; i++){
        emails_.push(email)
      }
    }
    return {result: result, email: emails_}
  }
  async editProject(email: string, index: number, newTitle:string, oldTitle: string, newDirection: string, oldDirection:string, token:string, projectId:string){
    const user = connection.collection('projects')
    const user_data = connection.collection('data')
    const owner = await user.findOne({email: email, 'projects.title': oldTitle}, {projection: {projects: 1}})
    if(newTitle === oldTitle && newDirection === oldDirection) return {error: "Make some changes."}
    let newProjectId = projectId
    if (owner != null){
      newProjectId = owner.projects[0].id_proj
    }
    const token_ = await checkToken(email, token)
    const roots_ = await checkRoots(email, oldTitle, newProjectId)
    if(token_ != null && roots_ != 0){
      await user.updateOne({'somelProjects.id_proj': newProjectId, 'somelProjects.project': oldTitle}, {$set:{'somelProjects.$.project': newTitle}})
      await user.updateOne({'projects.id_proj': newProjectId, 'projects.title': oldTitle}, {$set:{ 'projects.$.title':newTitle}})
      await user.updateOne({'projects.id_proj': newProjectId, 'projects.title': newTitle}, {$set:{ [`projects.$.direction`]:newDirection}})
      await user_data.updateOne(
        { 
          email: email, 
          projects: { $elemMatch: { title_proj: oldTitle } } 
        },
        { 
          $set: { 
            'projects.$.title_proj': newTitle
          } 
        }
      )
      const data = connection.collection('data')
      data.updateOne(
        { 
          email: email, 
          projects: { $elemMatch: { title_proj: oldTitle } } 
        },
        { 
          $set: { 
            'projects.$.title_proj': newTitle
          } 
        }
      )
      const teams = connection.collection('teams')
      await teams.updateOne(
      { 
        'projects.proj.id_proj': newProjectId,
        'projects.proj.project_name': oldTitle
      },
      { 
        $set: { 
          'projects.proj.$.project_name': newTitle
        } 
      })
      // const projects_ = await this.getAllProjects(email)
      // this.taskGateway.server.to(email).emit('getProjects', projects_)
      return {error: ''}
    }else{
      return {error: "You don`t have permissions."}
    }
  }
  async pushProject(email: string, title: string, direction: string, token:string){
    // console.log(email)
    // console.log(token)
    const token_ = await checkToken(email, token)
    // console.log(token_)
    if(token_!=null){
      const user = connection.collection('projects')
      const user_data = connection.collection('data')
      let resp = await user.findOne(
      { 
        email: email, 
        projects: { $elemMatch: { title: title } } 
      },
      { projection: { 'projects.$': 1 } }
      );
      if(resp!=null){
        return {error: "Error! Repeat name!"}
      }else{
        let id = new ObjectId()
        user.updateOne(
          {email: email}, 
          {$push:
            {projects: 
              {
                id_proj: id,
                title: title, 
                direction: direction
              }
            } 
          } as any
        )
        user_data.updateOne({email: email}, 
          {$push:{'projects': {
            id_proj: id,
            title_proj: title,
            blocks: []
          }}} as any)
        
        const teams = connection.collection('teams');

        await teams.updateOne(
        { 'projects.owner': email }, 
        { 
          $push: {
            'projects.proj': {
              id_proj: id,
              project_name: title,
              confirmed: [
                {
                  label: "Unteamed",
                  options: {
                    value: [],
                    label: [],
                    email: [],
                    roots: []
                  }
                }
              ],
              invited: [],
              team: []
            }
          }
        } as any
        );
        return {redirect: '', error: ''}
      }
    }else{
      return {redirect: 'http://localhost:3000/main_register', error: ''}
    }
  }

  async pushBlock(email: string, mood: string, project: string, title: string, projectId:string, token:string){
    const token_ = await checkToken(email, token)
    const roots_ = await checkRoots(email, project, projectId, ['admin'])
    const id_ = new ObjectId(projectId)
    if(token_!=null && roots_ != 0){
      const user_data = connection.collection('data')
      let rep = await user_data.findOne({
          'projects': {
              $elemMatch: {
                  'title_proj': project,
                  'id_proj': id_,
                  'blocks': {
                      $elemMatch: {
                          'method': title
                      }
                  }
              }
          }
      })
      if(rep ===null){
          let response = await user_data.findOne(
          { 
          'projects.id_proj': id_,
          projects: { $elemMatch: { title_proj: project } } 
        },
        { projection: { 'projects.$': 1 } }      
        )
        let length = 0
        if(response != null){
          length = response.projects[0].blocks.length
        }else{
          length = 0
        }
        await user_data.updateOne({ 
          'projects.id_proj': id_,
          'projects.title_proj': project 
        },
        { 
          $push: { 
            'projects.$.blocks': { 
              id: (length+1).toString(),
              method: title,
              mood: mood,
              tasks: {title:[''], direction: [''], developers: [], deadline: [], isChecked:[]}
            } 
          } as any
        })
        const blocks_ = await this.getBlocksFunction(email, project);
        this.taskGateway.upBlocks({payload: blocks_}, email, token, projectId);
        return {error: ''}
      }else{
        return {error: 'This block exists. Try another name.'}
      }
    }else{
      return {error: "You don`t have permissions."}
    }
  }
  
    async deleteProj(email: string, title: string, token:string){
      const cursor = connection.collection('projects')
      const projectId = await cursor.findOne({email: email, 'projects.title': title}, {projection: {id_proj: 1}})
      const token_ = await checkToken(email, token)
      const roots_ = await checkRoots(email, title, projectId)
      if(token_!=null && roots_ != 0){
        await cursor.updateOne(
          { email: email },
          { 
            $pull: { 
              "projects": { title: title }
            } as any 
          }   
        )
      const cursor_ = connection.collection('data')
      await cursor_.updateOne({email: email}, {$pull:{
        projects: { title_proj: title }
      } as any})

      await cursor.updateMany(
        { 
          'somelProjects.fromEmail': email,
          'somelProjects.project': title,
          'somelProjects': { $ne: [] }
        }, 
        { 
          $pull: { 
            somelProjects: {
              fromEmail: email,
              project: title 
            } 
          } 
        } as any
      );
      const cursor__  = connection.collection('teams')
      await cursor__.updateOne({'projects.owner': email}, {$pull:{
        'projects.proj': { project_name: title }
      } as any})
      const projects_ = await getAllProjectsSocket(email)
      this.taskGateway.server.to(email).emit('getProjects', projects_)
      return {error: ''}
    }else{
      return {error: "You don`t have permissions."}
    }
  }
}
@Injectable()
export class EmailsService implements OnModuleInit {
    constructor(
        private readonly taskGateway: TaskGateway,
    ) {}
    async onModuleInit() {
        const collection = connection.collection('projects');
        collection.watch([], { fullDocument: 'updateLookup' }).on('change', async (change) => {
            if (change.operationType != 'insert' &&
                change.operationType != 'update') {
            return;
            }
            const owner = change.fullDocument?.email;
            if (owner) {
              const projects = await getAllProjectsSocket(owner)
              this.taskGateway.server.to(owner).emit('projectsUpdate', projects)              
              this.taskGateway.server.to(owner).emit('projectsGet', projects)
            }
        });
        
    }
}