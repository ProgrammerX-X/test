// 'use server'
import {cookies} from 'next/headers'
import signature from 'cookie-signature'
const SECRET_ = process.env.SECRET
export async function cookie_setter(name: string, token: string, path: string, age?: number){
    try {
        const signedToken = signature.sign(token, SECRET_!)
        const setter = await cookies()
        const options: any = {
            httpOnly: true,
            sameSite: 'strict',
            path: path,
            secure: process.env.NODE_ENV === 'production'
        }
        
        if (age !== undefined) {
            options.maxAge = age
        }
        
        setter.set(name, signedToken, options)
    } catch(error) {
        console.log(error)
    }
}