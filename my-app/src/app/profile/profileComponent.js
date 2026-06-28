'use client'
import {hashCode} from '../projects/[proPanel]/modalTeams/hashCode'
import { useEffect, useState } from 'react'
import { fetch_short_getter } from '../projects/page'
import './page.css'
import Image from 'next/image';
import {countData, editOwner, deleteOwner} from './profileFetchs_'

export function ProfilePage(){
    const [email, setEmail] = useState('')
    useEffect(() => {
        const loadData = async () => {
            const cookies = await fetch_short_getter()
            setEmail(cookies.response)
        }
        loadData()
    }, [])
    const [modalOn, setModalOn] = useState(false)
    const [data, setCountData] = useState([])
    useEffect(() => {
        const fetchData = async () => {
            let resp = await countData();
            if(resp.status && resp?.status[0] == 'error'){
                window.location.href = `${process.env.DOMAIN+resp.status[1]}`
            }else{
                setCountData([resp.status[0], resp.status[1]]);
            }
        };
        fetchData();
    }, []);
    const [error, setError] = useState('')
    const edit_ = async(email)=>{
        setError('')
        const resp = await editOwner(email)
        if(resp.status[0] === 'error'){
            window.location.href = `${process.env.DOMAIN+resp.status[1]}`
        }
        if(resp.status.error !== ''){
            setError(resp.status.error)
        }
    }
    const deleteOwner_ = async()=>{
        const resp = await deleteOwner()
        if(resp.status[0] === 'error'){
            window.location.href = `${process.env.DOMAIN+resp.status[1]}`
        }
        // if(resp.status.redirect){
        //     console.log(process.env.DOMAIN+resp.status.redirect)
        //     // window.location.href = `${process.env.DOMAIN+resp.status.redirect}`
        // }
    }
    return(
    <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
        <div className='block'>
            <svg width={90} height={90} style={{display: 'flex', flexDirection: 'row', justifyContent:'center', alignItems: 'center', margin: '1em'}}>
                <circle 
                    fill={'rgb(' + hashCode(email?.split('@')[0] || '')[0] + ')'} 
                    cx={40} 
                    cy={40} 
                    r={30}/>
                <text 
                    x={40} 
                    y={47} 
                    fill={'rgb(' + hashCode(email?.split('@')[0] || '')[1] + ')'} 
                    fontSize='22' 
                    textAnchor='middle' 
                    style={{ textTransform: 'uppercase', fontFamily: 'REM'}}>
                    {email?.[0]?.toUpperCase() || '?'}
                </text>
            </svg>
            <div style={{display: 'flex', flexDirection: 'row', alignItems:'center', justifyContent: 'space-around', width: '100%', height: '100%'}}>
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent:'center'}}>
                    <textarea className='emailEdit' style={{fontSize: '1em', marginTop: '0.6em', fontFamily: 'REM', resize: 'none', width: '100%', border: 'none'}} value={email} onChange={(data)=>{setEmail(data.target.value)}}></textarea>
                    <p style={{color: 'red', fontSize: '0.8em', fontFamily: 'REM'}}>{error}</p>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', marginRight: '7em'}}>
                    <button style={{border: '2px solid #EAEBF0', color: '#363347', backgroundColor: '#F9F9F9',
                        borderRadius: '0.8em', fontWeight: '700', padding: '0.5em', width: '14em', marginRight: '2em'
                    }} onClick={()=>{edit_(email)}}>
                        <Image src='/images/icons/edit.png' width ={18} height = {18} alt='edit'
                    style={{marginRight: '0.2em'}}></Image>
                    Edits
                    </button>
                    <button style={{border: '2px solid, #efd3d2', backgroundColor: '#faf3f2', color: '#db1d29', fontWeight: '700',
                    borderRadius: '0.8em', padding: '0.5em', width: '100%'
                    }} onClick={()=>{deleteOwner_()}}><Image src='/images/icons/trash_butt_.png' width={15} height={16} alt='delete' style={{marginRight: '0.2em', marginLeft: '-0.3em'}}></Image>Delete Account</button>
                </div>
            </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
                <div className='block'><Image src='/images/icons/users.png' width={70} height={70} alt='teams' style={{marginLeft: '1em'}}></Image><span className="data" style={{paddingLeft: '1em'}}>Teams: {data[0] || 0}</span></div>
                <div className='block'><Image src='/images/icons/projects.png' width={70} height={70} alt='projects' style={{marginLeft: '1em'}}></Image><span className="data" style={{paddingLeft: '1em'}}>Projects: {data[1] || 0}</span></div>
        </div>
    </div>
    )
}