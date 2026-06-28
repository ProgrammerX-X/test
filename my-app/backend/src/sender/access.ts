import {connection} from '../db'
import { MongoClient, ObjectId } from 'mongodb';
export async function checkToken(email: string, token: string){
        const cursor = connection.collection('data')
        const validation = await cursor.findOne({email: email, login: token})
        return validation
    }

export async function checkRoots(email: string, project: string, projectId: any, agreeRoots?: any, teams_in?: boolean){
    const roots = connection.collection('teams')
    let resp = await roots.findOne({'projects.owner': email, 'projects.proj.project_name': project})
    if (resp != null){
        return 1
    }else{
        if (agreeRoots === undefined) return 0
        // if (teams_in === undefined) return 0
        let teams = await roots.aggregate([
        { $unwind: '$projects.proj' },
        { $match: { 'projects.proj.project_name': project } },
        { $unwind: '$projects.proj.team' },
        { $unwind: {path: '$projects.proj.team.options.email', includeArrayIndex: 'indexEmail'}},
        { $match: { 'projects.proj.team.options.email': email} },
        { 
            $project: { 
            _id: 0,
            index: '$indexEmail'
            }
        }
        ]).toArray()
        if (teams.length === 0) return 0
        const id = new ObjectId(projectId.id)
        const root = await roots.aggregate([
        { $unwind: '$projects.proj' },
        { $match: { 'projects.proj.id_proj': id } },
        { $unwind: '$projects.proj.team' },
        { $match: { 'projects.proj.team.options.email': email } },
        { 
            $project: {
            roots: '$projects.proj.team.options.roots',
            _id: 0
            } 
        },
        ]).toArray()
        let rootIndex = teams[0].index;
        let roots_all: string[] = []
        root.map((i=>{
            roots_all.push(i.roots[rootIndex])
        }))
        let valid_root:any = ''
        if(agreeRoots.includes('admin') && roots_all.includes('admin')){
            valid_root = 'admin'
        }else{
            valid_root = root[0].roots[rootIndex]
        }
        let agree:any[] = []
        agreeRoots.map((i)=>{
            if (valid_root === i){
                agree.push(1)
            }else{
                agree.push(0)
            }
        })
        if(agree.includes(1)){
            return 1
        }else{
            return 0
        }
    }
}
export async function getEmails_forSockets(teamName: string, owner: string){
        const cursor = connection.collection('teams')
        if (teamName === 'Unteamed'){
            let resp = await cursor.findOne({'projects.owner': owner})
            let emails_value: any[] = []
            let emails_label: any[] = []
            if (resp != null){
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
                // this.taskGateway.server.emit('getEmails', {payload: final_object});
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
            return final_object
        }
    }
}
export async function getProjects_create_forSocket(owner: string){
    const cursor = connection.collection('teams')
    let labels = await cursor.findOne({'projects.owner': owner}, {projection: {'projects.proj.project_name': 1}})
    let proj_names: object[]= []
    if (labels) {
        labels.projects.proj.map((item)=>{
            proj_names.push({label: item.project_name, value: item.project_name})
        })
        return {projects: proj_names, error: ''}
    }else{
        return {projects: {label:'', value:''}, error: 'You don`t have projects'}
    }
}

export async function developers_forSockets(email: string, path: string){
    const cursor = connection.collection('projects')
    const teams = connection.collection('teams')
    // console.log(email)

    let teams_all:any[] = []
    let guest_proj: any[] = []

    if (path==='/projects/teams/modalTeams'){
        let all_ = await teams.findOne({'projects.owner': email}, {projection: {'projects.proj': 1}})
        // console.log(all_)
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

export async function getProjectsAll_socket(email_: string){
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
//   DONT WORKING FIX
export async function getBlocksFunction_socket(email: string, project: string, projectId:string) {
const projects = connection.collection('projects')
const blocks = connection.collection('data')
const id = new ObjectId(projectId)
  const result = await blocks.aggregate([
    { $match: { "email": email } },
    { $unwind: "$projects" },
    {$match: {'projects.id_proj': id}},
    { $match: { "projects.title_proj": project } }
  ]).toArray();
  if(result.length >0){
    return result[0].projects.blocks
  }else{
    let resp = await projects.findOne({email: email, 'somelProjects.project': project}, {projection: {'somelProjects.fromEmail': 1}})
    if (resp!=null){
      const owner = resp.somelProjects[0].fromEmail
      let blocks_ = await blocks.aggregate([
        { $match: { "email": owner } },
        { $unwind: "$projects" },
        { $match: { "projects.title_proj": project } }
      ]).toArray();
        return blocks_[0].projects.blocks
    }
    }
}
//   if(result!==null){
//     let resp = await projects.findOne({email: email, 'somelProjects.project': project}, {projection: {'somelProjects.fromEmail': 1}})
//     console.log(resp)
//     if (resp!=null){
//       const owner = resp.somelProjects[0].fromEmail
//       let blocks_ = await projects.aggregate([
//     { $match: { "email": owner } },
//     { $unwind: "$projects" },
//     { $match: { "projects.title_proj": project } }
//   ]).toArray();
//       return blocks_
//     }
//   }else{
//     const blocks = result;
//     return blocks;
//   }
//   }