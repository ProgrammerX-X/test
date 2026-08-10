"use client"
import Image from "next/image"
// import './main_register/register.css'
import Link from "next/link"
// import { usePathname } from 'next/navigation';
import './globals.css'
import { useEffect } from "react"

function Header(){
  return(
        <div className='header'>
          <Link href='/'><Image src='/images/Icon.svg' width={190} height={80} alt='' className="icon" loading="eager"></Image></Link>
          <div className = 'menu'>
            <Link className='menu_comp' href = "/">Menu</Link>
            <Link className='menu_comp' href="/main_register">Register</Link>
            <Link className='menu_comp' href="/login">Login</Link>
            <Link className='menu_comp' href="/donate">Donate</Link>
          </div>
        </div>
    )
}
function Footer(){
  return(
    <div className="footer">
      <span className="footer_menu">Privacy Policy</span>
      <span className="footer_menu">Terms of Service</span>
      <span className="footer_menu">Design by anonimous</span>
    </div>
  )
}
export default function Main({ children }){
  useEffect(()=>{
    const interval = setInterval(async()=>{
    const heartbeat = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/guest/heartbeat`,{
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({answer: true}),
    })
  }, 30000)
  return () => clearInterval(interval);
  }, [])
  return(
    <html className="html_style">
      <head></head>
      <body>
        <Header></Header>
        <main className="main-content">
          {children}
        </main>
        <Footer></Footer>
      </body>
    </html>
  )
}
