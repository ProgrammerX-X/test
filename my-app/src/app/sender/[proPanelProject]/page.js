'use client'
import './page.css'
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
export default function Function_(){
    let path = usePathname()
    path = path.split('/')
    const [validation, setValid] = useState('')
    const [err, setErr] =useState(' ')
    const conf = async()=>{
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/confirm`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token: path[2]})
        })
        let resp = await response.json()
        setValid(resp)
    }
    useEffect(()=>{
        (async ()=>{await conf()})()
    }, [])
    const [code, setCode] = useState('')
    const check = async()=>{
        const response_ = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/check`,
            {method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: validation.resp, code: code,
                project: validation.project, fromEmail: validation.fromEmail}),
            }
        )
        const data = await response_.json()
        try{if(data.resp.text){
            setErr(data.resp.text)
        }}catch{
        if (data.redirect){
            window.location.href = data.redirect
        }}
    }
    return (
        <div style={{width: '100%', height: '100%'}}>
            <div className='formContainer'>
                <span className='confirm'>Confirm Email:</span>
                <input className='form_input' placeholder='Code' style={{fontFamily: 'REM',
                    paddingLeft: '1.3em'}} onChange={(e) => { setCode(e.target.value) }}></input>
                    <p style={{color: 'red', fontSize: '0.8em', fontFamily: 'REM'}}>{err}</p>
                <button className='button' onClick={()=>{check()}}>OK</button>
            </div>
        </div>
    )
}