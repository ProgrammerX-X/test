import {connection} from '../db'
export async function getAllProjectsSocket(email:string){
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