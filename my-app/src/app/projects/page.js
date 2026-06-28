'use client'
import {DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState, useEffect, useRef } from 'react'
import { SortableItem } from '../list/SortableItem';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import {ProPanel} from '../list/components'
import './page.css'
import { ModalWindow} from './modal';
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { io } from "socket.io-client";
import Image from 'next/image'

export default function Users_Projects(){
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return(
    <>
    <div className='project_block'>
        <ProPanel></ProPanel>
        {!mounted ? <div className='loading'>Loading...</div> : <ProjectBlocks />}
    </div>
    </>
  )
}

export const fetch_short_getter = async ()=>{
    let response = await fetch('http://localhost:3001/proPanel/get_email', {
      method: 'GET',
      credentials: 'include',
      headers: {
      'Content-Type': 'application/json'
      }})
      let resp = await response.json()
    return resp
}

function ProjectBlocks() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );
  const [allProjectsSet, setAll]=useState([])
  const [emailsProjects, setEmailsProjects] = useState([])
  // const [respState, setRespState] = useState()
  const projects_getter = async(email)=>{
    const resp__ = await fetch('http://localhost:3001/proPanel/projects', 
      {method:'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'email': email}),
      }
    )
    let resp_ = await resp__.json()
    if(resp_.resp.projects && resp_.emails){
      setAll([{projects:resp_.resp.projects}])
      setEmailsProjects([...resp_.emails])
    }
    return resp_
  }
  const projects_all = async(email)=>{
    const response_ = await fetch('http://localhost:3001/sender/getProj', 
      {method:'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'email': email}),
      })
      let re = await response_.json()
      setAll(prev => [...prev, ...re.resp])
      setEmailsProjects(prev=>[...prev, ...re.emails])
      return re
  }
  useEffect(()=>{}, [allProjectsSet])
  const [project, setProject] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [email, setEmail] = useState()
  let socket = useRef(null)
useEffect(()=>{ 
  socket.current = io(process.env.NEXT_PUBLIC_SERVER_DOMAIN, { auth: { email: email } });
let projectsOwn = [];
let projectsGuest = [];
socket.current.on('projectsUpdate', (projects) => {
  if (projects?.result?.projects) {
    projectsOwn = [...projects.result.projects];
    mergeAndSetProjects();
  }
  let newEmails = [...projects.email]
  projects.result.somelProjects.map((i)=>{
    newEmails.push(i.fromEmail)
  })
  setEmailsProjects(newEmails)
});

socket.current.on('projectsGet', (projects_guest) => {
  if (!projects_guest?.directions) return;
  
  let projectsEl = [];
  projects_guest.directions.forEach((element) => {
    if (element?.projects?.[0]) {
      projectsEl.push(element.projects[0]);
    }
  });
  projectsGuest = [...projectsEl];
  mergeAndSetProjects();
});

const mergeAndSetProjects = () => {
  const combined = [...projectsOwn, ...projectsGuest];
  setProject(combined);
  setTasks(combined);
};
  }, [email])
  useEffect(() => {
    const getData = async () => {
      let resp = await fetch_short_getter();
      resp = await projects_getter(resp.response);
      let resp_ = await projects_all(email)
      if(resp_.resp.length<1 && resp.resp.projects.length<1) return 0
      let projectsEl = []
      if(resp_!='' && resp_.resp.length>0){
        resp_.resp.map((element)=>{
          if(element === null) return
          projectsEl.push(element.projects[0])
        })
      }
      let p = JSON.parse(JSON.stringify(resp.resp.projects || ''))
      let p1 = JSON.parse(JSON.stringify(projectsEl || ''))
      let combined = [...p, ...p1];
      let deepCopy = JSON.parse(JSON.stringify(combined));

      setProject(deepCopy);
      setTasks(JSON.parse(JSON.stringify(deepCopy)));
    };
    getData();
  }, [email]);
  function handleDragEnd(event){
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setTasks((items) => {
      const oldIndex = active.id;
      const newIndex = over.id;
      
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  const updateTitle = (index, newTitle) => {
    const newProjects = [...tasks];
    newProjects[index].title = newTitle;
    setTasks(newProjects);
  };

  const updateDirection = (index, newDirection) => {
    const newProjects = [...tasks];
    newProjects[index].direction = newDirection;
    setTasks(newProjects);
  };
  // oldValue, newValue
  const [error, setError] = useState('')
  const [errIdx, setErrIdx] = useState('')
  const fetch_edit = async(email, index, newTitle, oldTitle, newDirection, oldDirection)=>{
    setError('')
    let projectId = allProjectsSet[0].projects[0].id_proj
    const response = await fetch('http://localhost:3001/proPanel/edit_projects',
      {method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email, index: index, newTitle, oldTitle, newDirection, oldDirection, projectId})
      }
    )
    let resp = await response.json()
    if(resp.err.error != ''){
      setErrIdx(index)
      setError(resp.err.error)
    }
    return resp
  }
  useEffect(()=>{
    const getter = async ()=>{
      let email = await fetch_short_getter()
      setEmail(email.response)
    }
    getter()
  }, [])

  const handlerButton = async (index)=>{
    if(tasks[index].title != project[index].title || tasks[index].direction != project[index].direction){
      let resp = await fetch_edit(email, index, tasks[index].title, project[index].title, tasks[index].direction, project[index].direction)
      if (resp.error){
        setError(resp.error)
        setErrIdx(index)
      }
    }else{
      setError('Make some changes.')
      setErrIdx(index)
    }
  }
  const [showModal, setModal] = useState(false)
  const createProject=()=>{
    setModal(true)
  }
  const closeWindow=()=>{
    setModal(false)
  }

    const addId=()=>{
      let count = 0
      let newId = tasks.forEach(task=>{
        Object.assign(task, {id: count+=1 || ''})
      })
      if (newId != undefined){
        setTasks(...newId)  
      }
    }
    useEffect(()=>{
      addId()
    }, [tasks])
  const deleteProject= async (index)=>{
    const resp = await fetch('http://localhost:3001/proPanel/deleteProject',
      {method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email, title: tasks[index].title})
      }
    )
    const res = await resp.json()
    if(res.error.error!=''){
      setErrIdx(index)
      setError(res.error.error)
    }
  }
  return (
    <>
    {project.length > 0 && tasks.length>0 && tasks !=false?
    
    <div className='main_'>
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        
        <SortableContext items={tasks.map((_, idx) => idx)}>
          {tasks.map((items, index) => {
            return (
              <SortableItem key={index} id={index}>
                <div className='block_' onClick={()=>{window.location.href=`/projects/${items.title}`}}>
                {/*  */}
                <Image src = '/images/icons/folder_.png' width={30} height={30} alt=''></Image> 
                  <textarea 
                    onClick={(e)=>{e.stopPropagation()}} 
                    onMouseDown={(e) => e.stopPropagation()} 
                    className='field' 
                    style={{fontSize: '2em', minHeight: '0.5em', fontWeight: '700'}}
                    value={items.title} 
                    onChange={(e) => updateTitle(index, e.target.value)}
                  />
                  <hr></hr>
                  <div style={{display: 'flex', alignItems: 'center', marginTop: '1em'}}>
                    <Image src = '/images/icons/user_.png' width ={30} height={30} alt=''></Image>
                    <div style={{display: 'flex', flexDirection: 'column', marginLeft: '1em'}}>
                      <p style={{fontSize: '0.8em', fontWeight: '100', fontFamily: 'REM', color: '#848ba2'}}>Owner</p>
                    <p style={{fontSize: '0.9em', fontFamily: 'REM', color: '#0e1221'}}>{emailsProjects[index]}</p>
                    </div>
                  </div>
                  <div style={{display: 'flex',  marginTop: '2em', width: '100%'}}>
                    <Image src = '/images/icons/list.png' width ={15} height={22} alt='' style={{marginTop: '1em'}}></Image>
                    <div style={{display: 'flex', flexDirection:'column', marginLeft: '2em', width: '100%'}}>
                      <p style={{fontSize: '0.8em', fontWeight: '100', fontFamily: 'REM', color: '#848ba2'}}>Description</p>
                      <textarea 
                        onClick={(e)=>{e.stopPropagation()}} 
                        onMouseDown={(e) => e.stopPropagation()} 
                        className='field' 
                        style={{fontSize: '1em', marginTop: '0em'}}
                        value={items.direction} 
                        onChange={(e) => updateDirection(index, e.target.value)}
                      />
                    </div>
                  </div>
                  {/* {errIndex.index === index ? (<p style={{color: 'red', fontSize: '0.8em', fontFamily: 'REM'}}>{err.error}</p>) : ''} */}
                  {errIdx === index ? <p style={{color: 'red', fontSize: '0.8em', fontFamily: 'REM'}}>{error}</p> : ''}
                <div className='handler'>
                  <button 
                    className='saver' 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(index)
                    }}>
                Delete
              </button>
                  <button 
                    className='saver' 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlerButton(index)
                    }}>
                Save
              </button>
              </div>
            </div>
              </SortableItem>
            );
          })}
          <SortableItem key={999} id = 'create_project'>
            <div className='block_' onClick={()=>createProject()}><p className='field'>Create project</p></div>
          </SortableItem>
        </SortableContext>
      </DndContext>
    </div>
    : <>
        <div className='main_'>
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={tasks.map((_, idx) => idx)}>
          <SortableItem key='create_project' id = 'create_project'>
            <div className='block_' onClick={()=>createProject()}><p className='field' style={{marginTop: '60%'}}>Create project</p></div>
          </SortableItem>
        </SortableContext>
      </DndContext>
    </div>
    </>
    }
    {showModal && <ModalWindow value={showModal} onClose={closeWindow} email={email}/>}
  </>
  );
}