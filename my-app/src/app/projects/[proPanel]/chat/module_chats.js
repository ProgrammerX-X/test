import './chats.css'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {sendMessage} from './chats_getSendData'
import {io} from 'socket.io-client'
import {fetch_short_getter} from '../../page'
export function ModalChat({deactivation, type, projectId, project, block, messages}){
    function handlerChat(){
        deactivation(false)
    }
    console.log(block)
    const [mess, setMess] = useState('')
    function sendInChat(){
        sendMessage(mess, type, projectId, project, block)
    }

    const [dataYear, setDataYear] = useState([])
    useEffect(()=>{
        if(messages && messages.length != undefined){
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
    useEffect(() => {
        const fetchData = async () => {
            let element = await fetch_short_getter()
            console.log(element)
        }
        fetchData()
    }, [])
    // SOCKET IO
    // const socket = useRef(null)
    // useEffect(()=>{        
    //     socket.current = io(process.env.NEXT_PUBLIC_SERVER_DOMAIN, {withCredentials: true})
    //     socket.current.emit('joinChat', {
    //         data: {
    //             projectId: projectId,
    //             // blockIndex: block
    //         }
    //     })
    // }, [])

return (
  <div className='chat'>
    <div className='headerChat'>
      <span>BlockChat</span>
      <Image 
        src='/images/icons/exit_png.png' 
        alt='Exit' 
        height={25} 
        width={25} 
        onClick={handlerChat}
      />
    </div>
    {messages && messages.length > 0 ? (
      <>
      {console.log(messages)}
        <div className='contentChat'>
          {messages.map((i, index) => {
            const isMine = i.data.isMine;
            const yearLabel = dataYear[index] || null;
            return (
              <div key={`${yearLabel}-${i.data.data.hours}-${index}`}>
                {yearLabel && (
                  <span style={{
                    color: '#0b2c5d',
                    padding: '0.4em',
                    borderRadius: '0.25em',
                    fontSize: '0.7em',
                    marginLeft: '45%',
                    paddingTop: '20px',
                    display: 'block'
                  }}>
                    {yearLabel}
                  </span>
                )}
                <div className={isMine ? "myMessage" : "otherMessage"}>
                  <span style={{ fontSize: '0.8em', wordWrap: 'break-word' }}>
                    {i.data.fromEmail}
                  </span>
                  <span style={{ fontSize: '1em', wordWrap: 'break-word' }}>
                    {i.data.messages}
                  </span>
                  <span style={{
                    fontSize: '0.8em',
                    wordWrap: 'break-word',
                    color: isMine ? '#eceff6' : '#0b2c5d',
                    marginRight: isMine ? undefined : '0',
                    marginTop: '0.7em',
                    display: 'block'
                  }}>
                    {i.data.data.hours}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className='form'>
          <Form mess={mess} setMess={setMess} sendInChat={sendInChat}/>
        </div>
      </>
    ) : (
      <>
        <div className='no-messages'>{console.log(messages)}No messages</div>
        <div className='form' style={{marginTop:'55%'}}>
          <Form mess={mess} setMess={setMess} sendInChat={sendInChat}/>
      </div>
      </>
    )}
  </div>
);
}

function Form({mess, setMess, sendInChat}){
  return(
    <>
      <textarea
        type='text'
        className='inputChat'
        placeholder='Message'
        onChange={(e) => setMess(e.target.value)}
        value={mess}
      />
      <button 
        className='sendButton' 
        onClick={sendInChat}
        disabled={!mess?.trim()}
      >
        Send
      </button>
    </>
  )
}