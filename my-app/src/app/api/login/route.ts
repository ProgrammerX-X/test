import { error_show, email_sender } from "../senders_/route"
// import { shifrator } from "../senders_/route"
import {cookie_setter} from '../cookies/cookie_set'
import {MongoClient} from 'mongodb'
import argon2 from 'argon2'
import { cookies } from "next/headers"
import {getLimit} from '../lib_redis/redis_connect'
import { NextRequest } from "next/server"
export async function POST(request:NextRequest){
    let data = await getLimit(request)
    let success = data.success
    try{
        if(success){
            const req = await request.json()
            const err = await valid_data(req['email'], req['password'])
            let err_check_db;
            if (err['err'] == ''){
                err_check_db = await check_db(req['email'], req['password'])
            }
            if (err_check_db!.err === 'no_err' && err_check_db!.params === 'ok'){
                await cookie_setter('error', '' as string, '/confirmation', 0)
                await cookie_setter('email', '' as string, '/api/confirmation', 0)
                await cookie_setter('email', '' as string, '/', 0)
                await cookie_setter('error', 'empty' as string, '/confirmation', 120)
                await cookie_setter('email', req['email'] as string, '/api/confirmation', 300)
                await cookie_setter('email', req['email'] as string, '/', 300)
                email_sender(req['email'],
                `<span>If you didn't send this message, please, <a href = "${process.env.DOMAIN}/resetPass" style={"text-decoration: underline"}>reset your password</a></span>`)
            }
            return Response.json({status: 200, err:err, err_db: err_check_db})}
        else{
            return Response.json({status: 429, err:{email: 'Please, retry later.'}, err_db: ''})
        }
    }catch(error){
        const err = error_show(error)
        return Response.json({status: 500, err: err, err_db: ''})
    }
}

async function valid_data(email: string, password: string){
    let params = {params: 'not ok'}
    try{
        const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
        password = password.replace(/\s/g, '') || ''
        let resp = {err: ''}
        if(!email_validation.test(email)){
            params.params = 'not ok'
            Object.assign(resp, {email: 'Email invalid, check it please.'})
        }else{
            params.params = 'ok'
        }
        if (password === ''){
            params.params = 'not ok'
            Object.assign(resp, {password: 'Password invalid, check it please.'})
        }
        Object.assign(resp, {params: params.params})
        return resp
    }catch(error){
        return {err: error_show(error), params: params}
    }
}

async function check_db(email: string, password: string){
    let db_client;
    let resp = {err: 'no_err', params:"not ok"}
    try{
        db_client = new MongoClient(process.env.DB_LOGIN as string, {
            serverSelectionTimeoutMS: 3500,
        })
        await db_client.connect()
        const ans = await db_client.db('login').collection('users').findOne({email: email})
        const ans_ = await db_client.db('login').collection('users').findOne({confirmed: false, email: email})
        const pass_check = await db_client.db('login').collection('users').findOne({email: email, password: argon2.verify(ans?.password, password)})
        if(ans_ != null){
            Object.assign(resp, {params:"ok"})
        }else{
            if (ans != null){
                if(await argon2.verify(ans?.password, password) === false){
                    Object.assign(resp, {password: 'Password invalid. Check it please.', params:"not ok"})
                }else{
                    pass_check === null ? Object.assign(resp, {password: 'Invalid password', params: 'not ok'}) : Object.assign(resp, {params: 'ok'})
                    // Object.assign(resp, {params:"ok"})
                }
            }else{
                Object.assign(resp, {email: 'Invalid email.', params:"not ok"})
            }
            console.log(resp)
        }
        return resp
    }catch(err){
        // console.log(error_show(err))
        Object.assign(resp, {err: error_show(err)})
    } finally {
    await db_client?.close()
}
}