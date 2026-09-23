import Image from "next/image"
import { useState } from "react"
import './modal.css'
import {useWindowSize} from "react-use"

export function Modal_Block({ onClose, email, project, projectId, getBlocks}){
  const [color, setColor] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
    const createBlock= async (color, title)=>{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/proPanel/create_block`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, color, project, title, projectId})
        }
      )
      let resp = await response.json()
      if(resp.error){
        setError(resp.error)
      }else{
        onClose()
      }
    }
    const {width, height} = useWindowSize()
    return(<div className='overlay'>
      <div className='modal__'>
        <div className='task_manager_header__'>
          <p className='task_manager_title' style={width<371 ? {fontSize: '1.3em'} : {}}>Task manager</p>
          <div className='close' onClick={onClose}>
            <Image style={width<891 ? {marginLeft:'2em'} : {}}src={'/images/icons/exit_png.png'} width={30} height={30} alt={'exit'}></Image>
          </div>
        </div>
        <hr></hr>

        <div className='container__'>
              <p className='createBlockTitle' style={width<371 ? {width: '3em'}:{}}>Create block</p>
              <p style={{fontSize:'1em', marginLeft:'1.5em', color:'#575c67'}}>Title</p>
              <input className='inputForm__' onChange={(e)=>{setTitle(e.target.value)}}></input>
              <span style={{marginLeft: '1.8em', fontSize: '0.8em', marginTop: '-0.8em', color: 'red'}}>{error}</span>
              <div className = 'change_color'>
                <p style = {{fontSize:'1em', marginLeft:'1.5em', color:'#575c67'}}>Color for block: </p>
                <input type='color' style={{marginLeft: '1em'}} onChange={(e)=>(setColor(e.target.value))}></input>
              </div>
                  <div className='block_create__'>
                    <button className='create_edit_task' style={width<891 ? {height:'4em', width: '20%'} : {}} onClick={async()=>{await createBlock(color, title), await getBlocks()}}>Create block</button>
                  </div>    
          </div>
        </div>
      </div>)
  }