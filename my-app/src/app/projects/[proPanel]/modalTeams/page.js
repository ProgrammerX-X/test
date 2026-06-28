'use client'
import React from 'react';
import './page.css'
import {ProPanel} from '../../../list/components'
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {DropWorkers, GetRoles} from './dropWorkers'
import Link from 'next/link'
import {fetch_short_getter} from '../../page'
import { usePathname } from 'next/navigation';
import {ModalCreateTeam, AddMember} from './modal_createTeams'
import {io} from 'socket.io-client'
import { hashCode } from './hashCode';
export default function TeamsPage() {
  return (
    <>
    <div style={{display: 'flex', height: 'auto', width: 'auto'}}>
      <ProPanel></ProPanel>
      <CreateTeam></CreateTeam>
    </div>
    </>
  );
}

function CreateTeam(){
  const [visible, setVisible] = useState(false)
  const setter_ = (value)=>{
    setVisible(value)
  }

  const [email, setEmail] = useState()
  useEffect(()=>{
    const getEmail=async()=>{
      const email_ = await fetch_short_getter()
      setEmail(email_.response)
    }
    getEmail()
  },[])

  let path = usePathname()
  const [teams, setTeams] = useState()
  const getDev_ = async()=>{
    if (!email) {return 0}
    else{
      const response_ = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/get_developers`,
        {method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: email, url: path}),
        }
      )
      let res = await response_.json()
      setTeams(res.resp)
    }
  }
  useEffect(()=>{
    getDev_()
  }, [email])

const socket = useRef(null);
useEffect(() => {
  if (!email) return;
  
  const newSocket = io(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}`, {
    auth: { email: email },
    transports: ['websocket'],
  });
  
  socket.current = newSocket;
  
  // console.log('Creating socket for email:', email);
  
  // newSocket.on('connect', () => {
  //   console.log('Socket connected successfully');
  // });
  
  newSocket.on('updateTeams', (newTeams) => {
    // console.log('updateTeams received:', newTeams);
    setTeams(newTeams)
  });
  
  // newSocket.on('connect_error', (error) => {
  //   console.error('Connection error:', error);
  // });
  
  return () => {
    // console.log('Cleaning up socket for email:', email);
    if (newSocket) {
      newSocket.disconnect();
    }
    socket.current = null;
  };
}, [email]);

  const [infoTeams, setInfo] = useState()
  const [index, setIndex] = useState()
  const showTeam = (index)=>{
    setIndex(index)
  }
  const [type, setType] = useState()
  const [teamN, setTeamN] = useState()
  const showTeam_info = (type)=>{
    if (teams.length < 1 || teams===undefined) return null;
    let info = []
    teams.map((element)=>{
      if (element.length>=1){
        element.map((item, index2)=>{
          info.push({project_name: item.project_name, [type]: item[type], owner: item.owner, guest: item.guest,
            id: item.id
          })
        })
      }
    })
    setType(type)
    setInfo(info)
  }
  const [visibleModalCreate, setVisibleModalCreateTeams] = useState(false)
  const [proj, setProjName] = useState()
  const setProj = (value) =>{
    setProjName(value)
  }
  const [teamIdx, setTeamIdx] = useState()
  return (
    teams !== undefined && teams !== null && (
      <div className='teams'>
        <div className='header_team'>
          <span style={{fontSize: '5em'}}>Teams</span>
        </div>
        <div className='team_list'>
          <ul style={{display: 'flex', flexDirection: 'column', cursor: 'pointer', width: 'auto', height: 'auto'}}>
            {teams.map((element, index) => {
                if (!element) return null;
                if (element.length > 1) {
                    return element.map((item, index2) => {
                      // {console.log(item.confirmed)}
                      if (item.confirmed != undefined && item.confirmed.length >=1){
                        return(
                          <li key={index2} className='team_list_element' onClick={() => {setter_(true), showTeam(index2), showTeam_info('confirmed')
                            setProj(item.project_name), setTeamIdx(item.confirmed[0].label), setTeamN(0)
                          }}>
                              <p>Project: {item.project_name}</p>
                              <p>Team: {item.confirmed[0].label}</p>
                              <p>Owner: {item.owner}</p>
                          </li>
                        )
                      }else{
                        return
                      }
                    });
                }
                return null;
            })}

            {teams.map((element, index) => {
              if (!element || !Array.isArray(element)) {
                return null;
              }
              return element.map((item, index2) => {
                if (item.teams && item.teams.length >= 1) {
                  return item.teams.map((team, index_)=>{
                      return(
                        <li key={index_} className='team_list_element' onClick={()=>{showTeam(index2), showTeam_info('teams'), setter_(true)
                          setProj(item.project_name), setTeamIdx(item.teams[index_].label), setTeamN(index_)
                        }}>
                          <p>Project: {item.project_name}</p>
                          <p>Team: {item.teams[index_].label}</p>
                          <p>Owner: {item.owner}</p>
                        </li>
                      )
                    }
                  );
                }
                return null
              });
            })}

            <li className='team_list_element' style={{display: 'flex', justifyContent:'center'}} onClick={()=>{setVisibleModalCreateTeams(true)}}>
              Create Team
            </li>
          </ul>
        </div>
        {/* {console.log(infoTeams, index, proj)} */}
        {visible && <Modal setter={setter_} teams={infoTeams} project_index={index} projectName = {proj} teamIndex={teamIdx} teamN={teamN} type={type}/>}
        {visibleModalCreate && <ModalCreateTeam setVisibleCreateTeams={setVisibleModalCreateTeams} teams={teams}
        ></ModalCreateTeam>}
      </div>
    )
  )
}

function Modal({setter, teams, project_index, projectName, teamIndex, teamN, type}){
  const [error, setError] = useState('')
  const deleteTeam= async ()=>{
    let resp = await fetch('http://localhost:3001/sender/deleteTeam',
      {method: 'POST',
        credentials:'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({teamName: teamIndex, projectName})
      }
    )
    let r = await resp.json()
    setError(r.error)
  }
  const [newRole, setNewRole] = useState({label: ''})
  const [oldRole, setOldRole] = useState({label: 'Select roles'})
  const [allRoles, setAllRoles] = useState()
  const getRoles=async ()=>{
    const resp = await fetch('http://localhost:3001/sender/getRoles',
      {method: 'GET',
        headers: {'Content-Type': 'application/json'}
      }
    )
    const resp_ = await resp.json()
    setAllRoles(resp_.resp)
  }
  
  useEffect(()=>{
    getRoles()
  }, [])
  const errorCallBack = (error)=>{
    setError(error.error)
  }
  const [status_, setStatus] = useState(false)
  const deleteMember = async(owner, teamName, email, project_name, type)=>{
    const resp = await fetch('http://localhost:3001/sender/deleteMember',
      {method: 'POST',
        credentials:'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({owner: owner, teamName: teamName, email: email, project_name: project_name, guest: teams[project_index].guest, type: type})
      }
    )
    let res = await resp.json()
    setError(res.error)
  }
  const [inputValue, setInputValue] = useState(teamIndex)
  const editTeam = async()=>{
    const resp = await fetch('http://localhost:3001/sender/edit',{
      method: 'POST',
      credentials:'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({title: inputValue, oldTitle: teamIndex,
      owner: teams[project_index].owner, guest: teams[project_index].guest, projectName: projectName})
    })
    let r = await resp.json()
    setError(r.error)
  }
  const editRoles = async (oldRoleValue, newRoleValue, email, emailIndex)=>{
    let res = await fetch('http://localhost:3001/sender/editRole', {
      method: 'POST',
      credentials:'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        projectName, 
        teamName: teamIndex, 
        owner: teams[project_index].owner, 
        roles: newRoleValue.label, 
        oldRole: oldRoleValue.label, 
        guest: teams[project_index].guest,
        email, emailIndex
      })
    })
    res = await res.json()
    setError(res.error)
  }
  return(
    <>
    <div className='overlay' onClick={()=>setStatus(false)}>
      <div className='modal_team'>
        <div className='header_'>
          <span style={{paddingLeft: '1em', fontSize: '2em'}}>Team settings</span>
          <Image src = '/images/icons/exit_png.png' onClick={()=>{setter(false)}} width={30} height={30}
          style={{marginRight: '1.5em', cursor: 'pointer'}} alt='exit'></Image>
        </div>
        <div className='container'>
          <div className='teamName'>
            <span style={{fontSize: '1.1em'}}>Team Name</span>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.5em', marginBottom: '1em'}}>
              {teamIndex === 'Unteamed'
                ? <input className='teamInput' value={teamIndex} readOnly></input>
                : <input value={inputValue} className='teamInput' onChange={(e)=>{setInputValue(e.target.value)}}></input>
              }
              <button onClick={()=>editTeam()} className='teamSave'>Save</button>
            </div>
          </div>
          <hr></hr>
          <div style={{display: 'flex', marginTop: '1em', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1em', alignItems: 'center'}}>
              <span style={{fontSize: '1.1em'}}>Team Members</span>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={(e)=>{e.stopPropagation()}}>
                <button style={{padding: '0.4em', borderRadius: '0.3em', backgroundColor: '#3b3b3b', color: '#fcfbfc', width: '8.5em', border: 'none', cursor: 'pointer'}}
                onClick={()=>setStatus(true)}
                >+ Add Member</button>
                {status_ && teams && <AddMember status={setStatus} teamName={teamIndex} owner = {teams[project_index]?.owner || ''} project = {teams[project_index].project_name} type={type} guest = {teams[project_index].guest} callBackErr={errorCallBack}> </AddMember>}
              </div>
            </div>
            <div className='emailBlock'>
              <p style={{color: 'red', fontSize: '0.8em', margin: '0.5em'}}>{error}</p>
              {teams.map((item, index_)=>{
                if (item.project_name === projectName){
                  return item[type][teamN].options.email.map((email, index__)=>{
                    const currentOldRole = {label: item[type][teamN].options.roots[index__]};
                    
                    return(
                      <div className='emailBlock_element' key={index__}>
                        <div className='emailBlock_element'>
                          <svg width={30} height={30}>
                            <circle fill={'rgb('+hashCode(email.split('@')[0])[0]+')'} cx={15} cy={15} r={15}></circle>
                            <text x={15} y={20} fill={'rgb('+hashCode(email.split('@')[0] || '')[1]+')'} fontSize='14' textAnchor='middle' style={{ textTransform: 'uppercase' }}>
                              {email[0]}
                            </text>
                          </svg>
                          <div style={{display: 'flex', flexDirection: 'column', marginLeft: '0.5em', padding: '0.2em', width: '18em'}}>
                            <span>{email.split('@')[0]}</span>
                            <span style={{color: '#52535e', marginTop: '0.1em'}}>{email}</span>
                          </div>
                          <div>
                            {teamIndex !== 'Unteamed' && (
                              <GetRoles 
                                callback={(newRoleValue) => {
                                  setOldRole(currentOldRole);
                                  setNewRole(newRoleValue);
                                  editRoles(currentOldRole, newRoleValue, email, index__);
                                }} 
                                methods={allRoles} 
                                width='11em'
                                value={currentOldRole.label}
                                // containerStyle_menu={{overflowY:'auto', height: '3em'}}
                              />
                            )}
                          </div>
                        </div>
                        <Image onClick={()=>deleteMember(item.owner, teamIndex, email, item.project_name, type)} 
                          src='/images/icons/trash_.png' width={20} height={20} alt='trash' style={{marginRight: '2em', cursor: 'pointer'}}/>
                      </div>
                    )
                  })
                }
                return null
              })}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', marginTop: '1em'}}>
              <hr></hr>
              <span style={{marginTop: '1em'}}>Team Actions</span>
              <button style={{marginTop: '1em', width: '21%', height: '2.5em', display: 'flex', 
                justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: '#faf3f2', border: '1px solid #efd3d2',
                padding: '1em', color: '#db1d29', borderRadius: '0.5em'}} onClick={()=>{deleteTeam(); setter(false)}}>
                <Image src='/images/icons/trash_butt_.png' width={15} height={16} alt='trash'></Image> 
                <span style={{marginTop: '0.25em', fontWeight: '600', cursor: 'pointer'}}>Delete Team</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}