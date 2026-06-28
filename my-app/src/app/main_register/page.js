'use client'
import './register.css'
import { useState } from 'react'
function Content(){
  const [error, setError] = useState('')
  async function sender(event){
    try{
    event.preventDefault();
    setError('')
    const form = event.target;
    const email = form.elements['email'].value.replace(/\s/g, '') || '';
    const password = form.elements['password'].value.replace(/\s/g, '') || '';
    const repeat = form.elements['repeat_password'].value.replace(/\s/g, '') || '';
    let response = {}

    response = await fetch('/api/register', 
    {
      method: "POST", 
      headers: {"Content-Type": 'application/json'},
      body: JSON.stringify({email, password, repeat})
    })
    const response_ = await response.json()
    const fields_user = ['email', 'password', 'repeat_password', 'error', 'status_error']
    let user_data = {}
    fields_user.forEach((i)=>{
      if (response_?.resp_?.[i]){
        Object.assign(user_data, {[i]: response_.resp_[i]})
      }
    })
    setError(user_data)
    if(response_.error){
      setError({limit: response_?.error})
    }
    if(response_.X_Custom == "success"){
      window.location.href = '/confirmation'
    }
    }catch(error){
      const error_ = new Error(`Error! ${error}`)
      throw error_
    }
  }

    let [type, setType] = useState('password');
    let [image, setImage] = useState('./images/icons/eye_closed.svg')

    let [type1, setType1] = useState('password');
    let [image1, setImage1] = useState('./images/icons/eye_closed.svg')

  return(<div className="content">
    <span className="reg">Register</span>
    <form className='form' name='form' onSubmit={sender}>
    <input type = 'text' placeholder="Email" className='form_input' name='email' style={{paddingLeft: '1.3em'}}></input>
    <p className='error'>
      {error?.email || ''}
      {error?.limit || ''}
    </p>
    <div className='password_'>
    <input type = {type} placeholder="Password" className='form_input' name='password' minLength={8} style={{paddingLeft: '1.3em'}}></input>
      <img src = {image} className = 'eye_closed' 
      onClick={() => {setType(type === 'password' ? 'text':'password');
        setImage(image === './images/icons/eye_closed.svg' ? './images/icons/eye_open.svg' : './images/icons/eye_closed.svg')
      }}></img>
    </div>
    <p className='error'>
      {error?.password || ''}
    </p>
    <div className='password_'>
    <input type = {type1} placeholder="Repeat password" className='form_input' name='repeat_password' minLength={8} style={{paddingLeft: '1.3em'}}>
    </input>
      <img src = {image1} className = 'eye_closed' 
      onClick={() => {setType1(type1 === 'password' ? 'text': 'password');
      setImage1(image1 === './images/icons/eye_closed.svg' ? './images/icons/eye_open.svg' : './images/icons/eye_closed.svg')
      }}></img>
    </div>
   <p className='error'>
   {error?.repeat_password || error?.status_error || error?.error || ''}</p>
    <button className='button' type='submit'><span>OK</span></button>
    </form>
  </div>)
}
export default function Main_(){
    return(<Content />
    )
}