import {NextRequest, NextResponse} from 'next/server'
import { cookie_setter } from './app/api/cookies/cookie_set'
import { MongoClient} from 'mongodb';
import signature from 'cookie-signature'
import {connection} from '../backend/src/db'
const SECRET_ = process.env.SECRET || 'rezervSECRET'
export async function proxy(request: NextRequest) {
    const path:string = request.nextUrl.pathname

    const cookie = request.cookies.get('status')?.value as string || ''
    const cookieUnsign = signature.unsign(cookie, SECRET_)

    const cookie_login = request.cookies.get('error')?.value as string || ''
    const cookieLoginUnsign = signature.unsign(cookie_login, SECRET_)
    const cookie_session = request.cookies.get('login')?.value as string || ''
    const cookiesessionUnsign = signature.unsign(cookie_session, SECRET_)

    const cookie_reset = request.cookies.get('resetPass')?.value as string || ''
    const cookieResetUnsign = signature.unsign(cookie_reset, SECRET_)

    const cookie_email = request.cookies.get('email')?.value as string || ''
    const cookieEmailUnsign = signature.unsign(cookie_email, SECRET_)

    let right_token =''
    if(cookieEmailUnsign != false){
        right_token = await getToken(cookieEmailUnsign);
    }

    if(path.startsWith('/projects') || path.startsWith('/profile')) {
        if(right_token!=null && cookiesessionUnsign != right_token){
            return NextResponse.redirect((new URL('/confirmation', request.url)))
        }
       if(right_token != null && cookiesessionUnsign === right_token){
            return NextResponse.next()
       }
       else{
            return NextResponse.redirect((new URL('/main_register', request.url)))
       }
    }

    if(path === '/confirmation'){
        if (cookieUnsign === 'success'){
            cookie_setter('status', 'success', '/confirmation', 0)
        } else if(cookieLoginUnsign == 'empty'){
            cookie_setter('error', 'empty', '/confirmation', 0)
        } else if(cookieResetUnsign == 'true'){
        }
        else{
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

async function getToken(email: string){
    const cursor = connection.collection('data');
    let resp = await cursor.findOne({'email': email});
    if (resp != null){
        return await resp.login
    }else{
        return null
    }
}

export const config = {
    matcher: ['/main_register', '/confirmation', '/projects','/login', '/projects/:path', '/projects/teams/modalTeams', '/profile']
}