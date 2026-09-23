'use client'
import {hashCode} from '../projects/[proPanel]/modalTeams/hashCode'
import { useEffect, useState } from 'react'
import { fetch_short_getter } from '../projects/page'
import './page.css'
import Image from 'next/image';
import {countData, editOwner, deleteOwner} from './profileFetchs_'
import { useWindowSize } from 'react-use'
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
                window.location.href = resp.status[1]
                console.log(resp.status[1])
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
            window.location.href = resp.status[1]
        }
        if(resp.status.error !== ''){
            setError(resp.status.error)
        }
    }
    const deleteOwner_ = async()=>{
        const resp = await deleteOwner()
        if(resp.status[0] === 'error'){
            window.location.href = resp.status[1]
        }
        if(resp.status.redirect){
            window.location.href = resp.status.redirect
        }
    }
    const {width, height} = useWindowSize()
    const [activeModal, setStateModal] = useState(false)

    return(
    <div style={width<891 ? {marginLeft:'1.5em'} : {}} className='profileChangeSection'>
        <div className='block'>
            <svg width={80} height={80} style={{display: 'flex', flexDirection: 'row', justifyContent:'center', alignItems: 'center', margin: '1em'}} className="accountIcon">
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
            <div className='editorBlock'>
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent:'center'}}>
                    <textarea className='emailEdit' style={{fontSize: '1em', marginTop: '0.6em', fontFamily: 'REM', resize: 'none', width: '100%', border: 'none', height:'1.5em'}} value={email} onChange={(data)=>{setEmail(data.target.value)}}></textarea>
                    <p style={{color: 'red', fontSize: '0.8em', fontFamily: 'REM'}}>{error}</p>
                </div>
                <div className='editorBlockButtons'>
                    <button className="editButton" onClick={()=>{edit_(email)}}>
                        <Image src='/images/icons/edit.png' width ={18} height = {18} alt='edit'
                    style={{marginRight: '0.2em'}}></Image>
                    <span>Edits</span>
                    </button>
                    <button className="deleteButton" onClick={()=>{setStateModal(true)}}><Image src='/images/icons/trash_butt_.png' width={15} height={16} alt='delete' style={{marginRight: '0.2em', marginLeft: '-0.3em'}}></Image>
                    <span>Delete Account</span></button>
                </div>
            </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
                <div className='block'><Image src='/images/icons/users.png' width={70} height={70} alt='teams' style={{marginLeft: '1em'}}></Image><span className="data" style={{paddingLeft: '1em'}}>Teams: {data[0] || 0}</span></div>
                <div className='block'><Image src='/images/icons/projects.png' width={70} height={70} alt='projects' style={{marginLeft: '1em'}}></Image><span className="data" style={{paddingLeft: '1em'}}>Projects: {data[1] || 0}</span></div>
        </div>
        {activeModal && <ModalProfileForDeletion setModal={setStateModal} deleteAccount={deleteOwner_}/>}
    </div>
    )
}
function ModalProfileForDeletion({setModal, deleteAccount}){
    return(
        <div className="overlay">
            <div className='modal'>
                <div className='modalHeader'>
                    <span style={{color:'#b90606', fontWeight:'700', fontSize:'1.5em', fontFamily: 'REM'}}>Deletion account</span>
                    <Image src='/images/icons/exit_png.png' width={35} height={35} alt='exit' onClick={()=>{setModal(false)}}></Image>
                </div>
                <div className='modalBody'>
                    <span style={{fontSize: '1em', fontFamily:'Calibri, Segoe UI, Helvetica Neue, Arial'}}>Are you sure to delete your account?</span>
                    <div className="modalBodyButtons">
                        <button className='deleteAccountButton'>Delete account</button>
                        <button className='cancelButton' onClick={async()=>{setModal(false), await deleteAccount()}}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    )
}