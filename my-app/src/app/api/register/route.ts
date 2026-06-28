'use server'
import {error_show, email_sender, shifrator} from '../senders_/route'
import {cookie_setter} from '../cookies/cookie_set'
import {MongoClient} from 'mongodb'
import {cookies} from 'next/headers'
import {getLimit} from '../lib_redis/redis_connect'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest){
    let data = await getLimit(request)
    let success = data.success
    // console.log(data)
    try{
        if(success){
            let response = await register_(request)
            const resp = response as any;
            const succ = resp.headers as string
            return Response.json(
                { success: 200, error: resp.error, resp_: resp, X_Custom: succ}
            );
        }else{
            return Response.json(
                { success: 429, error: 'Please, retry later.', resp_: '', X_Custom: ''}
            );
        }
    }catch(error: any){
        let error_ = await error_show(error);
        return Response.json({'error': error_})
    }
}

async function register_(request:Request){
    let my_resp;
    try{
        const response = await request.json()
        let {email, password, repeat} = response
        password = password.replace(/\s/g, '') || '';
        const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
        let resp:Object = {};
    const isValid = email_validation.test(email) 
        && password.length > 7 
        && repeat.length > 7 
        && password === repeat;
    if (!isValid) {
        if (!email_validation.test(email)) {
            Object.assign(resp, {'email': 'Email not correct, please check it.'})
        }
        if (!(password.length > 7 && repeat.length > 7)) {
            Object.assign(resp, {'password':'Password too short, check it please.'})
        }
        if (password !== repeat) {
            Object.assign(resp, {'repeat_password': 'Not ok, password must equal repeat pass'})
        }
        Object.assign(resp, {'headers': 'fall'})
    } else {
        const path = '/confirmation'
        my_resp = await confirmer(email, password, path);
        Object.assign(resp, {'status_error': my_resp['resp']})
        Object.assign(resp, {'headers': my_resp['redirect_succ']})
        Object.assign(resp, {'error': my_resp['text']})
    }
        return resp
    }catch(error){
        let error_ = await error_show(error);
        throw error_
    }
}
async function confirmer(email: string, password: string, path: string){
    let resp = ''
    let redirect_succ: Object = {};
    try{
        let db_ans = await write_in_database(email, password)
        if (db_ans!['params'] === true){
            const response_ = email_sender(email, '')
            const resp_ = await response_
            redirect_succ = resp_.headers
        }
        let text:string = db_ans!['text']
        await cookie_setter('email', '', '/api/confirmation', 0)
        await cookie_setter('email', '', path, 0)
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()

        await cookie_setter('status', redirect_succ as string, path, 120)
        await cookie_setter('email', email as string, path, 120)
        await cookie_setter('email', email as string, '/api/confirmation', 120)
        return {'resp': resp,
        'redirect_succ': redirect_succ,
        'text': text}
    }catch(error){
        const show = await error_show(error)
        return {'resp': show, 'redirect_succ': '', 'text': ''}
    }
}

async function write_in_database(email: string, password: string){
    let resp = '';
    let params: boolean = false;
    try{    
        interface User{
            email: string,
            password: string,
            confirmed: boolean,
            date_clean: Date
        }
        const hash = await shifrator(password)
        const client: MongoClient = new MongoClient(process.env.DB_LOGIN as string, {
            serverSelectionTimeoutMS: 3500
        })
        await client.connect()
        const db = client.db('login')
        if (email != ''){
            const user = await db.collection('users').findOne({email: email})
            const user_ = await db.collection('users').findOne({email: email, confirmed: false})
            if(user_){
                resp = 'Agree your email on login page!'
                params = false
            }else if(user){
                resp = 'User exist in database.'
                params = false
            }
            else{
                const user: User = {
                    email: email,
                    password: hash,
                    confirmed: false,
                    date_clean: new Date(Date.now() + 320*1000)
                }
                await db.collection('users').insertOne(user)
                params = true
            }
        }
        client.close()
        return {text: resp, params: params}
    }catch(error){
        const err = error_show(error)
        // console.log(err)
        return {text: '', params: false}
    }
}