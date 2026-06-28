import { error_show, email_sender, decrypt_token, shifrator } from "../senders_/route"
import {MongoClient} from 'mongodb'
import { NextRequest } from "next/server"
import { getLimit } from "../lib_redis/redis_connect"
export async function POST(request: NextRequest){
    const data = await getLimit(request)
    const success = data.success
    let status = ''
    try{
        if (success){
        const req = await request.json()
        let response = await data_checker(req.email, req.password)
        if (response.params == 'ok'){
            if(req.parameter){
                status = 'Token will be send to your email'
                let res = await checkUserInLogin(req.email)
                if (res != null){
                    await email_sender(req.email, '')
                    return Response.json({status: 200, errors: response, token: status})
                }else{
                    return Response.json({status: 500, errors: {params: false, emailError: 'User don`t exists. Please, go to register page.'}})
                }
            }
        }
        return Response.json({status: 200, errors: response, token: status})
    }else{
        return Response.json({status: 200, errors: {email: 'Please, retry later.'}, token: ''})

    }
    }catch(error){
        // console.log(error, 404)
        return Response.json({status: 500, errors: error_show(error), token: status})
    }
}

async function checkUserInLogin(email: string){
    const client = new MongoClient(process.env.DB_LOGIN as string, {
        serverSelectionTimeoutMS: 3500,
    })
    await client.connect()
    const res = client.db('login').collection('users').findOne({email: email})
    return res
}

async function data_checker(email: string, password: string){
    let params = {params: 'not ok'}
    try{
        const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
        password = password.replace(/\s/g, '') || ''
        let resp = {err: '', params: 'not ok'}
        if(!email_validation.test(email)){
            params.params = 'not ok'
            Object.assign(resp, {email: 'Email invalid, check it please.'})
        }else{
            params.params = 'ok'
        }
        if (password === '' || password.length < 8){
            params.params = 'not ok'
            Object.assign(resp, {password: 'Password invalid, check it please. > 8'})
        }
        Object.assign(resp, {params: params.params})
        return resp
    }catch(error){
        return {err: error_show(error), params: params}
    }
}
export async function PUT(request: Request){
    const req = await request.json()
    let new_pass = req.new_password 
    new_pass = new_pass.trim()
    new_pass = await shifrator(new_pass)
    const token = req.token
    // console.log(token, 64)
    const email = req.email
    let resp_ = {err: 'error', params:"not ok", status: '200'}
    let stat = await decrypt_token(token);
    Object.assign(resp_, {status: stat.status})
    if (token === '' || token === undefined || stat.status != '') {
        Object.assign(resp_, {status: 404})
        return Response.json(resp_)
    } else {
        let db_client;
        try{
            db_client = new MongoClient(process.env.DB_LOGIN as string, {
                serverSelectionTimeoutMS: 3500,
            })
            await db_client.connect()
            const ans = await db_client.db('login').collection('users').findOne({confirmed: true, email: email})
            if (ans != null){
                await db_client.db('login').collection('users').updateOne({email: email}, {$set: {password: new_pass}})
                Object.assign(resp_, {err: 'all ok', params: 'all ok'})
            }else{
                Object.assign(resp_, {err: 'error', email: 'invalid email or you wasn`t confirmed it', params:"not ok"})
            }
            await db_client?.close()
            return Response.json({'resp': resp_})
        }catch(err){
            await db_client?.close()
            return Response.json({'resp': error_show(err)})
        }
    }
}