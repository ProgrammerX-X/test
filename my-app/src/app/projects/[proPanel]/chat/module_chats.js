import './chats.css'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {sendMessage} from './chats_getSendData'
import {chatUpdate} from './websocketsChat'
export function ModalChat({deactivation, type, projectId, project, block, messages}){
    function handlerChat(){
        deactivation(false)
    }
    const [mess, setMess] = useState('')
    function sendInChat(){
        sendMessage(mess, type, projectId, project, block)
    }
    // useEffect(()=>{
    //     console.log(messages)
    // }, [messages])

    const [dataYear, setDataYear] = useState([])
    useEffect(()=>{
        if(messages){
            let data = []
            messages.map((i)=>{
                if(!data.includes(i.data.data.year)){
                    data.push(i.data.data.year)
                }else{
                    data.push(null)
                }
            })
            setDataYear(data)
        }
    }, [messages])
    useEffect(()=>{chatUpdate()}, [])
    return(
    (messages && <div className='chat'>
        <div className='headerChat'>
            <span>BlockChat</span>
            <Image src = '/images/icons/exit_png.png' alt='' height={25} width={25} onClick={()=>handlerChat()}></Image>
        </div>
        <div className='contentChat'>
        {messages.map((i, index) => {
            const isMine = i.data.isMine;
            const yearLabel = dataYear[index] != null ? dataYear[index] : null;
            return (
            <div key = {yearLabel+i.data.data.hours}>
                {yearLabel && <span style={{color: '#0b2c5d', 
                padding: '0.4em', borderRadius:'0.25em', fontSize: '0.7em', marginLeft: '45%', paddingTop: '20px'}}>{yearLabel}</span>}
                <div className={isMine ? "myMessage" : "otherMessage"}>
                <span style={{ fontSize: '0.8em', whiteSpace: 'wrap' }}>{i.data.fromEmail}</span>
                <span style={{ fontSize: '1em', whiteSpace: 'wrap' }}>{i.data.messages}</span>
                <span style={{ fontSize: '0.8em', whiteSpace: 'wrap', color: isMine ? '#eceff6' : '#0b2c5d', marginRight: isMine ? undefined : '0',
                    marginTop: '0.7em'
                }}>
                    {i.data.data.hours}
                </span>
                </div>
            </div>
            );
        })}
        </div>
        <div className='form'>
            <textarea type='text' className='inputChat' placeholder='Message' onChange={(e)=>{setMess(e.target.value)}}></textarea>
            <button className='sendButton' onClick={()=>sendInChat()}>Send</button>
        </div>
    </div>)
    )
}