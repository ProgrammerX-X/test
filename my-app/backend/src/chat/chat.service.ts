import { Injectable } from "@nestjs/common";
import {checkToken, checkRoots} from '../sender/access'
import {connection} from '../db'
const { ObjectId } = require('mongodb');
@Injectable()
class userData{

}
export class chatService {
    
    async getMessages(email:string, token:string, type:string, projectId:string, project:string, block?:string){
        const accessEmail = await checkToken(email, token)
        const accessRoots = await checkRoots(email, project, projectId, ['read', 'write, admin'])
        if(accessEmail!= null && accessRoots!=0){
            const chatCall = await connection.listCollections({name: 'chat'}).toArray()
            if(chatCall.length < 1){
                await connection.createCollection('chat')
                connection.collection('chat').createIndex({'idMessage': 1})
            }
            let resp:any; 
            if(type==='block'){
                const chatsAccess = connection.collection('chat')
                resp = await chatsAccess.find({idProject: new ObjectId(projectId).toString(), project: project, block: block, type: 'block'}).toArray()
            }else if(type==='global'){
                const chatsAccess = connection.collection('chat')
                resp = await chatsAccess.find({idProject: new ObjectId(projectId).toString(), project: project, type: 'global'}).toArray()
            }else{
                return {error: 'This chat does not exist.'}
            }
            let dataChat:any = []
            if(resp!=null){
                resp.map((i:any)=>{
                    dataChat.push({error: '',
                        data: {
                            fromEmail: i.fromEmail,
                            messages: i.message,
                            data: i.sendAt,
                            isMine: email === i.fromEmail
                        }
                    })
                })
            }
            dataChat.sort((a:any, b:any) => {
                const timeA = new Date(`${a.data.data.year.replace(/:/g, '-')} ${a.data.data.hours}`).getTime();
                const timeB = new Date(`${b.data.data.year.replace(/:/g, '-')} ${b.data.data.hours}`).getTime();
                return timeA - timeB;
            });
            return dataChat
        }else{
            return {error: 'You don`t have permissions.', data: {}}
        }
    }
    async sendMessages(email:string, token:string, type:string, projectId: Object, project:string, message:string, time:Object, block?:string){
        const accessEmail = await checkToken(email, token)
        const accessRoots = await checkRoots(email, project, projectId, ['read', 'write, admin'])
        if(accessEmail!= null && accessRoots!=0){
            const getOwner = connection.collection('projects')
            let id = new ObjectId(projectId['id'])
            let owner_data = await getOwner.findOne({email: email, 'projects.id_proj': id, 'projects.title': project})
            let owner = ''
            if(owner_data===null){
                owner_data = await getOwner.findOne({email: email, 'somelProjects.id_proj': id, 'somelProjects.project': project})
                if(owner_data!=null){
                    owner_data.somelProjects.map((i)=>{
                        if(i.project === project && i.id_proj.toString() == id.toString()){
                            owner = i!.fromEmail
                        }
                    })
                }else{
                    return {redirect: process.env.DOMAIN}
                }
            }else{
                owner = owner_data!.email
            }
            const chatAccess = connection.collection('chat')
            const idMessage = new ObjectId()
            await chatAccess.insertOne({
                idMessage: idMessage,
                idProject: projectId['id'],
                project: project,
                fromEmail: email,
                ownerEmail: owner,
                type: type,
                block: block,
                message: message,
                sendAt: time
            })
        }
    }
}