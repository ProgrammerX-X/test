import {connection} from '../db'
import { connection_login } from '../db'
import {promises as fs} from 'fs'
import path from 'path'
export async function deleteAccountGuest(guestOption:string){
    let logFile = path.join(`${process.cwd()}`,'logs','logFile.txt')
    try{
        await fs.mkdir(path.dirname(logFile), {recursive: true})
        if(guestOption === process.env.ACCESS_FOR_CRON){
            const cursor_projects = connection.collection('projects')
            const cursor_data = connection.collection('data')
            const cursor_teams = connection.collection('teams')
            // const cursor_login = connection_login.collection('login')
            let unactive = await cursor_projects.find({active:false}).toArray()
            // console.log('Unactive:', unactive)
            if(unactive.length>0){
                await cursor_projects.deleteMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 30]}, active:false})
                await cursor_data.deleteMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 30]}, active:false})
                await cursor_teams.deleteMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 30]}, active:false})
                // await cursor_login.deleteMany({$expr:{$gt:[{$dateDiff: {startDate: "$date", endDate:"$$NOW", unit:'minute'}}, 30]}, active:false})
                await fs.appendFile(logFile, `${new Date().toISOString().replace('T', ' ')}, Deleted guests: ${unactive.length} \n`)
            }
        }else{
            await fs.appendFile(logFile, `${new Date().toISOString().replace('T', ' ')}, guestOption not valid \n`, { flag: 'a' },)
            return{error:'guestOption not valid'}
        }
    }catch(e){
        console.log(e)
        fs.writeFile(logFile, `${new Date().toISOString().replace('T', ' ')}, Error(code, ~29s, scripts.ts)! ${e} \n`, { flag: 'a' },)
    }
}