"use client"
import './main.css'
import {ProPanel} from './list/components'
import { useState, useEffect } from 'react'
import {checkLogin} from './page_Fetch'

export default function Main(){
  const window_ = ()=>{
    window.location = '/main_register'
  }
  const [check, setCheck] = useState(429)
  useEffect(()=>{
    const check_ = async()=>{
      const resp = await checkLogin()
      if(resp){
        setCheck(resp.status)
      }
    }
    check_()
  }, [])
  return(
    <>
    <div className='main_1'>
      {check === 200 && <div style={{position: 'absolute',zIndex: '2'}}><ProPanel/></div>}
      <div className="shadow">
        <span className='titleMain'>Welcome</span>
        <span className='description'>We present you a modern platform for organizing your team's work. 
          Here you will find all the necessary tools for effective collaboration, 
          project management, and achieving common goals.</span>
        <button className='starter_button' onClick={window_}>Start</button>
        </div>
  </div>
  </>)
}