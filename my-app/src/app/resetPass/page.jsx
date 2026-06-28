// import './resetPass.css'
'use client'
'use strict'
import '../main_register/register.css'
import {useState, useEffect} from 'react'
export default function resetPassPage()
{
    return(<div><ResPage></ResPage></div>)
}
function ResPage(){
    const [error, setError] = useState({})
    const [jsxShow, setJSXshow] = useState(true)
    const [send, setParameter] = useState(true)
    async function update_pass(event){
        event.preventDefault();
        setError({})
        const form = event.target
        const email = form.email.value.replace(/\s/g, '') || ''
        const password = form.password.value.replace(/\s/g, '') || ''
        const response = await fetch('/api/resetPass', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: email, password: password, parameter: send})
        })
        const res = await response.json()
        console.log(res)
        setError({token: res.token, errors: res.errors })
        if(res.errors.params == 'ok'){
            setJSXshow(false)
            setParameter(false)
        }
        const token = form.token.value.replace(/\s/g, '')
    if (token && res.errors?.params === 'ok') {
        const responsePut = await fetch('/api/resetPass', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token: token, email: email, new_password: password})
        })
        
        const respPut = await responsePut.json()
        if(respPut!=null){
            setError({
                JWT_token_Err: respPut.status,
                emailError: respPut.email
            })
            
            if(respPut.resp.params === 'all ok' && respPut.resp.err === 'all ok' && respPut.resp.status === ''){
                window.location.href = '/login'
            }
        }
        }
    }
    return(<div className='content'>
        <h1 className='reg'>Reset password</h1>
        <form className='form' onSubmit={update_pass}>
            <input className='form_input' name = 'email' placeholder='Email'></input>
            <p className='error'>{error.errors?.email || ''}</p>
            <div className='password_'>
                <input className='form_input' name = 'password' placeholder='New password'></input>
            </div>
            <p className='error'>{error.errors?.password || ''}</p>
            <p className='error'>{error?.token || ''}</p>
            <input hidden = {jsxShow} className='form_input' placeholder = 'Enter token' name='token'/>
            <p className = 'error'>{error?.JWT_token_Err || ''}</p>
            <p className='error'>{error.errors?.emailError || ''}</p>
            <button className='button'><span>OK</span></button>
        </form>
        
    </div>)
}