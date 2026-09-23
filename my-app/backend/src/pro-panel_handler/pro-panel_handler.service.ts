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
import { convertSegmentPathToStaticExportFilename } from 'next/dist/shared/lib/segment-cache/segment-value-encoding';
import { EventEmitter2 } from '@nestjs/event-emitter';

const { ObjectId } = require('mongodb');
@Injectable()
export class ProPanelHandlerService {
  constructor(
    @InjectModel(GetBlock.name) private dataBase: Model<GetBlock>,
    @InjectModel(GetProjects.name) private dataBase_: Model<GetProjects>,
    // private taskGateway: TaskGateway
    private eventEmitter: EventEmitter2
  ) {}

  async getBlocksFunction(email: string, token:string, project: string, checkedOrNot: boolean, projectId:string | null | {_id: string}) {
    // NEW SCRIPT
    let checkToken_ = 0
    let checkRoots_ = 0
    if(checkedOrNot===true){
      checkToken_ = 1
      checkRoots_ = 1
    }else{
      checkToken_ = await checkToken(email, token)
      checkRoots_ = await checkRoots(email, project, projectId, ['admin', 'write', 'read'])
    }
    if(checkToken_!=0 && checkRoots_!=0){
      let newProject = decodeURIComponent(project)
      const ownerOrNot = await this.dataBase.aggregate([
      { $match: { "email": email } },
      { $unwind: "$projects" },
      { $match: { "projects.title_proj": newProject } }
    ]);
    if(ownerOrNot.length===0){
      const client = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS || '')
      const connection = client.db('users_projects')
      const cursor = connection.collection('projects')
      let resp = await cursor.findOne({email: email, 'somelProjects.project': newProject}, {projection: {'somelProjects.fromEmail': 1}})
      if (resp!=null){
        const owner = resp.somelProjects[0].fromEmail
        let blocks_ = await this.dataBase.aggregate([
          { $match: { "email": owner } },
          { $unwind: "$projects" },
          { $match: { "projects.title_proj": newProject } }
        ]);
        await client.close()
        this.eventEmitter.emit("updateBlocks", ({
          email: email,
          project: project,
          projectId: projectId,
          blocksData: blocks_[0].projects}))
        return blocks_[0].projects
      }else{
        this.eventEmitter.emit("updateBlocks", {blocks:[]})
        return {blocks: []}
      }
    }else{
      this.eventEmitter.emit("updateBlocks", ownerOrNot[0].projects)
      return ownerOrNot[0].projects
    }
  }else{
    return {blocks:[]}
  }

  // OLD SCRIPT

    // project = decodeURIComponent(project)
    // console.log(project, 29)
  // const result = await this.dataBase.aggregate([
  //   { $match: { "email": email } },
  //   { $unwind: "$projects" },
  //   { $match: { "projects.title_proj": project } }
  // ]);
  // let res = String(result)
  // if(res==''){
  //   const client = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS || '')
  //   const connection = client.db('users_projects')
  //   const cursor = connection.collection('projects')
  //   let resp = await cursor.findOne({email: email, 'somelProjects.project': project}, {projection: {'somelProjects.fromEmail': 1}})
  //   if (resp!=null){
  //     const owner = resp.somelProjects[0].fromEmail
  //     let blocks_ = await this.dataBase.aggregate([
  //   { $match: { "email": owner } },
  //   { $unwind: "$projects" },
  //   { $match: { "projects.title_proj": project } }
  // ]);
  //   await client.close()
  //     return blocks_[0].projects
  //   }
  //   else{
  //     // let newProject = decodeURIComponent(project)
  //     if(project!=null && project!=undefined && project!=''){
  //       const projectOwner = await this.dataBase_.findOne({'email': email, 'projects.title': project})
  //       if(projectOwner==null){
  //         const projectOwner = await this.dataBase_.findOne({'email': email, 'somelProjects.project': project})
  //         if(projectOwner === null){
  //           return "redirect"
  //         }else{
  //           await client.close()
  //           return await this.getBlocksFunction(email, project)
  //         }
  //       }        
  //       else{
  //         await client.close()
  //         return await this.getBlocksFunction(email, project)
  //       }
  //     }else{
  //       await client.close()
  //       return "redirect"
  //     }
  //   }
  // }else{
  //   const blocks = result;
  //   return blocks[0].projects;
  // }
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
    const owner = await user.findOne({email: email, 'projects.id_proj': new ObjectId(projectId)}, {projection: {projects: 1}})
    console.log(newTitle, oldTitle, newDirection, oldDirection)
    console.log(newTitle === oldTitle && newDirection === oldDirection)
    if(newTitle === oldTitle && newDirection === oldDirection) return {error: "Make some changes."}
    const alreadyChaged = await user.findOne({email:email, 'projects.title':newTitle}, {projection: {projects:1}})
    const alreadyChangedDirection = await user.findOne({email:email, 'projects.direction':newDirection}, {projection: {projects:1}})

    if(alreadyChaged!=null && alreadyChangedDirection != null) return {error: "Already changed!"}
    const token_ = await checkToken(email, token)
    const roots_ = await checkRoots(email, oldTitle, projectId)
    if(token_ != 0 && roots_ != 0 && owner!=null){
      const r = await user.updateOne({'somelProjects.id_proj': new ObjectId(projectId)}, {$set:{'somelProjects.$.project': newTitle}})
      console.log(r, 112)
      await user.updateOne({'projects.id_proj': new ObjectId(projectId)}, {$set:{ 'projects.$.title':newTitle}})
      await user.updateOne({'projects.id_proj': new ObjectId(projectId)}, {$set:{ [`projects.$.direction`]:newDirection}})
      await user_data.updateOne(
        { 
          email: email, 
          projects: { $elemMatch: { id_proj: new ObjectId(projectId) } } 
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
          projects: { $elemMatch: { id_proj: new ObjectId(projectId) } } 
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
        'projects.proj.id_proj': new ObjectId(projectId),
      },
      { 
        $set: { 
          'projects.proj.$.project_name': newTitle
        } 
      })
      const chats = connection.collection('chat')
      let resp = await chats.updateMany({'ownerEmail':email, idProject: projectId.toString()}, {$set:{project: newTitle}})
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
    if(token_!=0){
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
    // project = decodeURIComponent(project)
    const roots_ = await checkRoots(email, project, projectId, ['admin'])
    const id_ = new ObjectId(projectId)
    if(token_!=0 && roots_ != 0){
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
              id: new ObjectId(),
              method: title,
              mood: mood,
              tasks: {title:[''], direction: [''], developers: [], deadline: [], isChecked:[]}
            } 
          } as any
        })
        // const blocks_ = await this.getBlocksFunction(email, token, project, true, projectId);
        // SOCKET IO
        // this.taskGateway.upBlocks({payload: blocks_}, email, token, projectId);
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
      if(token_!=0 && roots_ != 0){
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
      const chat = connection.collection('chat')
      // let resp = 
      await chat.deleteMany({'ownerEmail':email, 'project': title})
      // console.log(resp)
      // SOCKET IO
      // this.taskGateway.server.to(email).emit('getProjects', projects_)
      return {error: ''}
    }else{
      return {error: "You don`t have permissions."}
    }
  }
}
// SOCKET IO
// @Injectable()
// export class EmailsService implements OnModuleInit {
//     constructor(
//         private readonly taskGateway: TaskGateway,
//     ) {}
//     async onModuleInit() {
//         const collection = connection.collection('projects');
//         collection.watch([], { fullDocument: 'updateLookup' }).on('change', async (change) => {
//             if (change.operationType != 'insert' &&
//                 change.operationType != 'update') {
//             return;
//             }
//             const owner = change.fullDocument?.email;
//             if (owner) {
//               const projects = await getAllProjectsSocket(owner)
//               this.taskGateway.server.to(owner).emit('projectsUpdate', projects)              
//               this.taskGateway.server.to(owner).emit('projectsGet', projects)
//             }
//         });
        
//     }
// }