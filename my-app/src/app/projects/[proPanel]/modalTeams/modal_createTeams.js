'use client'
import { useState, useEffect, useRef } from "react"
import './page'
import Image from 'next/image';
import {GetRoles} from './dropWorkers'
import {fetch_short_getter} from '../../page'
import { io } from "socket.io-client";

export function ModalCreateTeam({setVisibleCreateTeams, teams}){
    const [teamName, setTeamName] = useState('')
    const [selectedMembers, setMembers] = useState()
    const [selectedProjects, setSelectedProjects] = useState()
    const [error, setError] = useState('')
    const [error_, setError_] = useState('')
    const createTeam=async(owner, title, members, project)=>{
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/createTeam`,{
            method: 'POST',
            credentials:'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({owner: owner, title: title, project: project, members: members})
        })
        let r = await resp.json()
        setError_(r.error)
    }
    const [email, setEmail] = useState()
    useEffect(()=>{
        const getEmail=async()=>{
            const email_ = await fetch_short_getter()
            setEmail(email_.response)
        }
        getEmail()
    },[])
    useEffect(() => {
        if (email) {
            getEm()
        }
    }, [email])
    const [methods, setMethods] = useState({label: '', value: ''})
    const getEm = async() => {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/getAllEmails`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({owner: email})
    })
    let res = await resp.json()
    setMethods(res.resp)
}
    const [projects, setProjects] = useState()
    const getAllProjects = async()=>{
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/getAllProjects`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({owner: email})
        })
        let resp_ = await resp.json()
        setProjects(resp_.projects)
        setError(resp_.error)
    }
    
    useEffect(()=>{
            getAllProjects()
    }, [email])
    const socket = useRef(null)
    useEffect(()=>{
        socket.current = io(process.env.NEXT_PUBLIC_SERVER_DOMAIN)
    return () => {
        socket.current?.disconnect();
    };
    }, [])

    useEffect(()=>{
        if(!email || !socket.current) return;
        socket.current.emit('join', email)
    }, [email])

    useEffect(() => {
        if (!socket.current) return;

        const handleEmails = (emails) => {
            setMethods(emails);
        };

        const handleProjects = (projects) => {
            setProjects(projects?.projects);
            setError(projects?.error);
        };

        socket.current.on("emailsUpdated", handleEmails);
        socket.current.on("projectAllUpdated", handleProjects);

        return () => {
            socket.current.off("emailsUpdated", handleEmails);
            socket.current.off("projectAllUpdated", handleProjects);
        };
    }, []);
    const wasSubmittedRef = useRef(false);
    useEffect(() => {
        if (error_.length === 0 && wasSubmittedRef.current) {
            setVisibleCreateTeams(false);
        }
    }, [error_]);
    return(
            <div className='overlay'>
              <div className='modal_team'>
                  <div className='header_'>
                    <span style={{paddingLeft: '1em', fontSize: '2em'}}>Create Team</span>
                    <Image src = '/images/icons/exit_png.png' onClick={()=>{setVisibleCreateTeams(false)}} width={30} height={30}
                    style={{marginRight: '1.5em', cursor: 'pointer'}} alt='exit'></Image>
                  </div>
                <div className='container'>
                    <div style={{display: 'flex', flexDirection: 'column', marginBottom: '1em',}}>
                        <span style={{fontSize: '1.1em'}}>Team Name</span>
                        <input className='teamInput' placeholder = 'Enter team name' style={{width: '100%', marginTop: '1em'}}
                        value={teamName} onChange={(e)=>{setTeamName(e.target.value)}}></input>
                        <p style={{fontSize: '0.8em', color: 'red'}}>{error_}</p>
                        <span style={{fontSize: '0.8em', marginTop: '1em', color: '#535d6f'}}>Choose a name that represents yor team.</span>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <hr></hr>
                        <div style={{marginTop: '1em', marginBottom: '0.7em'}}>
                            <span>Add Members</span>
                            <GetRoles width='100%' value = 'Select emails' containerStyle={{marginTop: '1em'}} type='checkbox' methods = {methods || []} callback={(value)=>{setMembers(value)}}></GetRoles>
                        </div>
                        <span style={{fontSize: '0.8em', color: "#535d6f"}}>You can add members now or invite them later.</span>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', marginTop: '1em', marginBottom: '1em', minHeight: '8em'}}>
                        
                        <hr></hr>
                        <div style={{marginTop: '1em'}}><span style={{fontSize: '1.1em'}}>Project</span>
                        <p style={{fontSize: '0.8em', color: 'red'}}>{error}</p>
                            {error==='You don`t have projects' ? '' : 
                            <GetRoles width='100%' value = 'Select project' containerStyle={{marginTop: '1em'}} type='radiobutton' methods = {projects || []} callback={(value)=>{setSelectedProjects(value)}}></GetRoles>}
                        </div>
                    </div>
                    </div>
                    <hr></hr>
                    <div style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'flex-end', marginTop: '1em'}}>
                        <button style={{marginRight: '1em', padding: '0.7em', width: '5em', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#110c09', backgroundColor: '#f8f8f8', fontWeight: '700',
                            fontSize: '0.9em', border: '2px solid #dcdbe0', borderRadius: '0.3em', width: '5em'
                        }} onClick={()=>setVisibleCreateTeams(false)}><span>Cancel</span></button>
                        <button style={{marginRight: '1em', padding: '0.7em', width: '5em', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#fdfefe', backgroundColor: '#3c3c3b', fontWeight: '700',
                            fontSize: '0.9em', border: '2px solid #373737', borderRadius: '0.3em', width: '9em'
                        }}
                        
                        onClick={()=>{createTeam(email, teamName, selectedMembers, selectedProjects); wasSubmittedRef.current = true; 
                            error_!=='' ? setVisibleCreateTeams(true) : setVisibleCreateTeams(false)
                            }}
                        >Create Team</button>
                    </div>
                </div>
            </div>
    )
}

export function AddMember({status, teamName, owner, project, type, guest, callBackErr}){
    const [visible, setVisible] = useState()
    const setVisible_ = (vis)=>{
        status(vis)
    }
    const callback_ = (dataCallBack)=>{
        getEmails(dataCallBack)
        addMember(dataCallBack)
    }
      const addMember = async(emails)=>{
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/addMemberTeam`, {
          method: 'POST',
          credentials:'include',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({team: teamName, owner: owner, project_name: project, emails: emails, guest})
        })
        const err = await resp.json()
        callBackErr(err)
      }

    const getEmails = async ()=>{
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/getEmails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({team: teamName, owner: owner})
        })
        let res = await resp.json()
        return res.method
    }

    const [em, setEm] = useState()
    useEffect(()=>{
        const caller = async()=>{
            let res = await getEmails()
            if(res){
            setEm(res)}
        }
        caller()
    }, [])

    const socket = useRef(null)
    useEffect(() => {
        socket.current = io(process.env.NEXT_PUBLIC_SERVER_DOMAIN);
        socket.current.on('emailsUpdated', (emails) => {
            setEm(emails)
        });
        return () => socket.current?.disconnect();
    }, [])
    return(
        <div style={{width: '100%', height: '100%', display: 'flex', zIndex: 1000}} onClick={()=>{setVisible_(false)}}>
            <div className='modal_addMember' onClick={(e) => e.stopPropagation()}>
                <GetRoles width = '100%' value ={'Select emails'} type='checkbox' callback={callback_} methods={em}></GetRoles>
            </div>
        </div>)
}