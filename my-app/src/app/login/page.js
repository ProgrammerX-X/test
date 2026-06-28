'use client'
import {useState} from 'react'
import '../main_register/register.css'
import Link from 'next/link'
export default function Login(){
    return(
    <LoginForm />)
}
function LoginForm(){
    const [error, setError] = useState('')
    async function login(event){
        setError('')
        event.preventDefault()
        const email = event.target.email.value.replace(/\s/g, '') || '';
        const password = event.target.password.value.replace(/\s/g, '') || '';
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        const resp = await response.json()
        if(resp.err_db.email){
            setError({email: resp.err_db.email})
        }else{
            setError(resp.err)
        }
        if(resp.err.params === 'ok' && resp.err_db.params  === 'ok'){
            window.location.href = '/confirmation'
        }
    }
    const [type, setType] = useState('password');
    const [image, setImage] = useState('./images/icons/eye_closed.svg')

    return(
    <div className='content'>
        <span className='reg'>Login</span>
        <form className='form' onSubmit={login}>
        <input className='form_input' placeholder='Email' type='text' name = 'email' style={{paddingLeft: '1.3em'}}></input>
        <p className = 'error'>{error.email}</p>
        <div className='password_'>
        <input className='form_input' placeholder='Password' type={type} name = 'password' style={{paddingLeft: '1.3em'}}></input>
        <img src = {image}
        onClick={() => {setType(type === 'password' ? 'text':'password');
        setImage(image === './images/icons/eye_closed.svg' ? './images/icons/eye_open.svg' : './images/icons/eye_closed.svg')
      }}
        className='eye_closed'>
            </img>
            </div>
        <p className='error'>{error.password}</p>
        <Link href = '/resetPass' className='forgotPass'>Forgot password?</Link>
        <button className='button'><span>OK</span></button>
        </form>
    </div>)
}