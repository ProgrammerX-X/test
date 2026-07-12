import nodemailer from 'nodemailer'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
export async function email_sender(email: string, text: string){
    try{
        const sender_ = process.env.EMAIL as string
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth:{
                user: sender_,
                pass: process.env.EMAIL_PASS as string
            }
        })
        const token = await token_generator(email)
        const info = await transporter.sendMail({
            from: "ProPanel Team",
            to: email,
            subject: 'ProPanel TOKEN',
            html: `<div style ={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#00288E'}}>
                <h1 style={{fontFamily: 'sans-serif', fontSize: '2em', marginTop: '1.5em'}}>ProPanel token</h1>
                <h2 style = {{fontFamily: 'sans-serif', fontSize: '1.2em', marginTop: '2em', color: 'black'}}>Don't share this token: <span style = {{color: '#00288E'}}>${token}</span><br /></h2>
            </div></h1>${text}`
        })
    return {headers: 'success'}
}catch(error){
    return error_show(error)
  }
}

export async function token_generator(email: string){
    const token_gen = require('jsonwebtoken')
    const token = token_gen.sign(
        { userId: email, role: 'user' },
        process.env.TOKEN_JWT,
        {expiresIn: 840}
    )
    return token
}
export async function error_show(error: any){
    return error.message
}

export async function shifrator(password: string){
    const config = {
        type: argon2.argon2id,
        memoryCost: 26624,
        timeCost: 4,
        parallelism: 4,
        hashLength: 32,
        saltLength: 16
    }
    const hash = await argon2.hash(password, config)
    return hash
}
export async function decrypt_token(token: string){
    let error_m = '';
    // console.log(token, 59)
    try{
        jwt.verify(token, process.env.TOKEN_JWT!, (error: Error | null, decoded: any) => {
            if (error) {
                error_m = error.message
            } else {
                error_m = ''
            }
        })
        // console.log(error_m, 'SENDERS')
        return {status: error_m}
    }catch(error){
        return {status: error_show(error)}
    }
}
export async function GET() {
    return new Response(JSON.stringify({ 
        message: 'API is working. Use POST to send emails.' 
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}