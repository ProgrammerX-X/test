'use client'
import { useState } from "react";
import './page.css'
import Image from 'next/image'


export function ModalWindow({value, onClose, email} ){
    const [title, setTitle] = useState('')
    const [direction, setDirection] = useState('')
    const [error, setError] = useState('')
    const send_data = async() =>{
        const response = await fetch('http://localhost:3001/proPanel/create_project',
            {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, title, direction})
            }
        )
        let resp = await response.json()
        
        if (resp.status.error != ''){
            setError(resp.status.error)
        }else{
            setError('')
            onClose()
        }
        if (resp.status.redirect && resp.status.redirect != ''){
            window.location.href = resp.status.redirect
        }
    }
    if (!value) return null;
    return(
        <>
        <div className='overlay_'>
            <div className='modal_'>
                <div className='task_manager_header_'>
                    <p className='task_manager_title_'>Create project</p>
                    <div className={'close_'}>
                        <Image src={'/images/icons/exit_png.png'} width={30} height={30} alt="exit"  onClick={onClose}></Image>
                    </div>
                </div>
                <hr className={'hr_'}></hr>
                <div className='container_'>
                    <span className='title_dir'>Title</span>
                    <textarea className='input_' onChange={(e)=>{setTitle(e.target.value)}}></textarea>
                    <span className='title_dir'>Direction</span>
                    <textarea className='input_' onChange={(e)=>{setDirection(e.target.value)}}></textarea>
                    <span style={{fontSize: '0.7em', color: 'red', fontFamily: 'REM'}} className='title_dir'>{error}</span>
                    <div className='agree'>
                    <button className="agree_button" 
                    onClick={() => {send_data()
}}>
                        Create project
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}