'use client'
import './list.css'
import {useWindowSize} from "react-use"
import Image from 'next/image'
import { useState } from 'react'
import ClickAwayListener from "react-click-away-listener";
export function ProPanel({path}){
    if(path === undefined){
        path = 'teams'
    }
    const{width, height} = useWindowSize()
    const [show, setShow] = useState(false)
    return(width>890 ?
    <List /> :
        <ClickAwayListener onClickAway={() => setShow(false)}>
            <div className="burger" onClick={() => setShow(true)} style={!show ? { backgroundImage: "url('/images/icons/burgerMenu.png')" } : { backgroundImage: "none" }}>
                {show ? <List styles={{margin:'0'}}></List> : null}
            </div>
        </ClickAwayListener>
)}

function List({styles}){
    return(
    <div className='list' style={{...styles}}>
        <div className='list_inside'>
            <ul className='functions'>
                <li className='element_func'><a href = '/projects' className='href'>Project</a></li>
                <li className='element_func'><a href = {`/projects/teams/modalTeams`} className='href'>Teams</a></li>
                <li className='element_func'><a href = {`/profile`} className='href'>Profile</a></li>
            </ul>
        </div>
    </div>
    )
}