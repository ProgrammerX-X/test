import {email_sender, error_show, decrypt_token, token_generator} from '../senders_/route'
import {cookies} from 'next/headers'
import {MongoClient} from 'mongodb'
import { cookie_setter } from '../cookies/cookie_set';
import signature from 'cookie-signature'
import { NextRequest } from 'next/server';
import { getLimit } from '../lib_redis/redis_connect';
const SECRET_ = process.env.SECRET || 'revervSECRET'
export async function POST(request: NextRequest){
    let resp_ = {parameter: '', resp: ''};
    const data = await getLimit(request)
    const success = data.success
    try{
        if(success){
        const resp = await request.json()
        const token = resp.token
        const response = await decrypt_token(token)
        if(await response['status'] === ''){
            const cookieStore = await cookies()
            const emailCookie = (cookieStore.get('email')?.value) ?? ''
            const emailCookieUnsigned = signature.unsign(emailCookie, SECRET_ || 'rezervSECRET')
            if (emailCookieUnsigned){
                let confResp = await confirm_email(emailCookieUnsigned)
                resp_.parameter = confResp as string
            }
        }else{
            resp_.parameter = 'error'
        }
        resp_.resp = response.status as string
            return Response.json({parameter: resp_.parameter, resp: resp_.resp, status: 200})}
        else{
            return Response.json({parameter: resp_.parameter, resp: {limit: 'Please, retry later.'}, status: 429})}
    } catch(error){
        let err = error_show(error)
            return Response.json(
        {parameter: '404', resp: err, status: 404}
    )
    }
}

export async function GET(){
    let response;
    try{
        const cookieStore = await cookies()
        let emailCookie = cookieStore.get('email')?.value || undefined
        if (emailCookie == undefined){
            response = 'Error, email empty'
        }else{
            emailCookie = signature.unsign(emailCookie, SECRET_) || ''
            response = ''
            email_sender(emailCookie, '')
        }
        return Response.json(
            {status: 200, resp: response}
        )
    }catch(error){
        return Response.json({status: 'error', error: error_show(error)})
    }

}

async function confirm_email(email: string){
    const cookieStore = await cookies()
    const access = await token_generator(email)
    try{
        const client: MongoClient = new MongoClient(process.env.DB_LOGIN as string, {
            serverSelectionTimeoutMS: 3500
        })
        await client.connect()
        const db = client.db('login')

        const client_userData : MongoClient = new MongoClient(process.env.DB_LOGIN_FOR_USERS_PROJECTS as string, {
                serverSelectionTimeoutMS: 3500
            })
            await client_userData.connect()
            const db_ = client_userData.db('users_projects')

        if (await db.collection('users').findOne({email: email, confirmed: true}) === null && email!=''){
            await db.collection('users').updateOne(
            { email: email },
            { $set: { confirmed: true }, $unset: {date_clean: 1}})
            client.close()
            try{
                let res = await db_.collection('data').insertOne({email: email, login: access, projects: []})
                res = await db_.collection('projects').insertOne({email: email, projects: [], somelProjects: []})
                res = await db_.collection('teams').insertOne({projects: {owner: email, proj: [{}]}})
                client_userData.close()
            }catch(error){
                console.log(error, 'confirmation_route!')
            }
            return 'ok'
        }else{
            await db_.collection('data').updateOne({email: email}, {$set: {login: access}})
        }
        cookieStore.set('email', '', { path: '/', maxAge: 0 })
        cookieStore.set('login', '', { path: '/', maxAge: 0 })
        await cookie_setter('email', email, '/')
        await cookie_setter('login', access, '/')
        return Response.json({status:'all ok'})
    }catch(error){
        console.log(error, "route.confirmation")
        return Response.json({status: error_show(error)})
    }
}