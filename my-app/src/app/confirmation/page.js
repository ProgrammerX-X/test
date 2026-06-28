'use client'
import Countdown from "react-countdown"
import "../main_register/register.css"
import {useState} from 'react'
export default function Confirmation(){
    const [status, setStatus] = useState('')
    async function fetch_(event){
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)
        const token = formData.get('code')
        const response = await fetch('/api/confirmation', 
            {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token: token})
        }
        )
        const resp = await response.json()
        if (resp.resp == 'jwt expired'){
            setStatus('Your token will old. Please improve it.')
        }else if(resp.resp == 'jwt malformed'){
            setStatus('Your token invalid.')
        }else if(resp.resp == 'jwt must be provided'){
            setStatus('Field empty.')
        }
        else{
            setStatus(resp.resp)
        }
        if(resp.resp.limit){
            setStatus(resp.resp.limit)
        }
        if (resp.status === 200)
            window.location.href = '/projects'
    }
    async function again_send(){
        await fetch('/api/confirmation', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        })
    }
    const [time, setTime] = useState(Date.now()+60000)
    const call = (seconds)=>{
        if (seconds > 0) return
        setTime(Date.now() + 60000)
        again_send()
    }
    return(<div className='content'>
        <span className='reg'>Code has been sent to the mail</span>
        <form className='form' onSubmit={fetch_}>
            <input type='text' className='form_input' placeholder="Code" name= 'code'></input>
            <p className='error'>{status}</p>
        <Countdown
        key={time}
        date={time}
        renderer={({ seconds }) => (
        <span 
            className={seconds === 0 ? 'forgotPass active' : 'forgotPass'} 
            style={{ color: seconds === 0 ? 'black' : '#979797' }}
            onClick={()=>call(seconds)}
            >Send again 
            <span style={{
                color: seconds < 15 ? 'red' : '#979797'
            }}> {seconds}</span>...
        </span>)}
        />
            <button className='button'><span>OK</span></button>
        </form>
    </div>)
}