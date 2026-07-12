'use client'
import './page.css'
import {ProPanel} from '../../list/components'
import {useState, useEffect, useRef, useCallback} from 'react'
import dynamic from 'next/dynamic';
import {DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from '../../list/SortableItem';
import Image from 'next/image';
import {Modal_Block} from './modal'
import { usePathname } from 'next/navigation';
import {fetch_short_getter} from '../page'
import {GetRoles} from './modalTeams/dropWorkers'
import io from 'socket.io-client';
import {Gantt} from './gante/gante'
import React from 'react'
import { convertServerPatchToFullTree } from 'next/dist/client/components/segment-cache/navigation';
import {ModalChat} from './chat/module_chats'
import {getMessage} from './chat/chats_getSendData'

const Select = dynamic(
  () => import('react-select'),
  { ssr: false }
);

const SmallModal = ({ callback }) => {
  const [emailValue, setEmailValue] = useState('')
  const path = usePathname()
  let path_ = path.split('/')
  let email;
  useEffect(()=>{
    const func_ = async()=>{
      email = await fetch_short_getter()
      if(email){
      email = await email.response}
    }
    func_()
  }, [])
  const [error, setError] = useState('')
  const fetch_share = async() =>{
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/send_mail`,{
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: emailValue, project: path_[2], fromEmail: email})
    }
    )
      let resp = await response.json()
      if (resp.error){
        setError(resp.error)
      }else{
        setError('')
      }
    }
  return (
    <div className='overlay_small' onClick={()=>{share(false)}}>
      {/*  */}
      <div className='modal_small_' onClick={(e) => e.stopPropagation()}>
        {/*  */}
        <div className='small_header'>
          <span style={{fontSize: '1.3em', fontFamily: 'REM', marginLeft: '1em'}}>Share</span>
            <img 
            src='/images/icons/exit_png.png' 
            onClick={() => { callback(false) }}
            alt="exit"
            width={25} height={25}
            style={{marginRight: '2em'}}
          />
        </div>
        <div className={'container_small'}>
          <span style={{marginTop: '1em', fontSize: '1.1em', fontFamily: 'REM'}}>Email</span>
          <span style={{fontSize: '0.8em', fontFamily: 'REM', color: 'red', marginTop: '1em'}}>{error}</span>
          <input style={{ marginTop: '1em', height:'3em'
          }} className='inputForm' type='text' onChange={(e)=>setEmailValue(e.target.value)} value={emailValue}></input>
          <button style={{width: '10em', marginTop: '2em', padding: '0.5em', fontSize: '0.9em', borderRadius: '1em', border: '1px solid silver'}}
          onClick={()=>{fetch_share()}}
          >Send</button>
        </div>
      </div>
    </div>
  )
}

export default function Pro_Panel(){
  const [smallModal_, setSmallModal] = useState(false)
  const setValue = (value)=>{
    setSmallModal(value)
  }
    const share = (value)=>{
      setValue(value)
    }
    const path = usePathname()
    let path_ = path.split('/')
    const func = [{value: 'Project', label: 'Project'}, {value: 'Calendar', label: 'Calendar'}]
    let colors = ['#1b5bb8', '#2f67c0', '#1b5bb8', '#2f67c0', '#2261bf', '#1e4d93']
    const [gant, setGant] = useState(false)
    const gantOrBlocks = (value)=>{
      setGant(value)
    }
    const [deadline, setDeadline] = useState([])
    const callbackDeadline = (value)=>{
      if(value){
      setDeadline(value)}
    }
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
       
            {smallModal_ && <SmallModal callback={setValue} />}
            <div className='proPanel_content' suppressHydrationWarning>
              {!gant && (
              
              <ProPanel path={path_[2]} />)}
              <div className='column_'>
                <div className='row_'>
                  <div style={{marginLeft:'1em', overflowY:'hidden'}}>
                    <DropLists methods={func} colors={colors} callback={gantOrBlocks} />
                  </div>
                  <img 
                    src='/images/icons/share.png' 
                    style={{marginLeft: '2em', marginTop: '0.7em', cursor: 'pointer', width: '1em', height: '1.5em'}}
                    onClick={() => share(true)}
                  />
                </div>
                {!gant && (
              <>
                <TaskMaker callbackDeadline={callbackDeadline} />
                </>)}
                {
                  gant && (
                    <>
                    <Gantt deadline={deadline}></Gantt>
                    </>
                  )
                }
              </div>
            </div>
      </div>
    )
}

function DropLists({methods, colors, callback}){
    const [selectedOption, setSelectedOption] = useState(methods[0]);
    useEffect(()=>{
      if(selectedOption.label === 'Calendar'){
        callback(true)
      }else{
        callback(false)
      }
    }, [selectedOption])
    return(
    <Select options={methods} value={selectedOption} onChange={setSelectedOption}
    className='selector'
    styles={{
        control: (base) => ({
      ...base,
      background: `linear-gradient(to top, ${colors[0]}, ${colors[1]})`,
      border: 'none'
      
    }),
    singleValue: (base) => ({
      ...base,
      color: '#ffffff',
      fontFamily: 'REM'
    }),
        menuList: (base)=>({...base,
            marginTop: 0,
            padding: 0,
            color: 'white',
            fontFamily: 'REM',
            background: `linear-gradient(to top, ${colors[2]}, ${colors[3]})`,
            width: 'auto'
        }),
        menu: (base)=>({...base, 
            top: '2em',
            padding: 0,
    }),
        option: (base, state) => ({
        ...base,
        padding: 0,
        height: '2em',
        paddingLeft: '0.6em',
        paddingTop: '0.4em',
        overflow: 'hidden',
        '&:hover':{
            backgroundColor: `${colors[4]}`,
            color: 'white'
        },
      ...(state.isFocused && {
        backgroundColor: 'transparent',
        color: '#ffffff',
        boxShadow: 'none'
      }),
      ...(state.isSelected && {
        backgroundColor: '',
        color: 'white',
        '&:hover': {
          backgroundColor: `${colors[5]}`
        }
      })}),
        dropdownIndicator: (base) => ({
        ...base,
        color: '#ffffff',
        '&:hover': {
            color: '#ffffff'
        }
    }),
    container:(base)=>({
      ...base,
      width: 'auto',
      // height: '7em'
    })
    }}>
    </Select>
    )
}
async function get_blocks(method, obj){
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/proPanel`, {
      method: method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(obj),
    });
    let resp = await response.json();
    return resp
}
let object_title = {
  'title': [],
  'direction': [],
  'developers': [
    {'':[]}
],
'deadline':[
  {
  'start': '', 
  'end': ''
  }]
}
function TaskMaker({callbackDeadline}){
  const router = usePathname()
  const rout = router.split('/').filter(segment=>segment!='')
  const [tasks_, setTasks] = useState([])
  const [email, setEmail] = useState('')
  const [projectId, setProjectId] = useState('')
  useEffect(()=>{
    const getEmail=async()=>{
      const email = await fetch_short_getter()
      setEmail(email.response)
    }
    getEmail()
  },[])
  useEffect(() => {
    if (!email) return;
    let blocks = [''];
    const fetchBlocks = async () => {
    blocks = await get_blocks('POST', {"email": email, "project": rout[1]});
    if(blocks.resp === 'redirect'){
      window.location.href = '/projects';
    }else{
      setTasks(blocks.resp.blocks)
      setProjectId({id: blocks.resp.id_proj})
    }
  };
  fetchBlocks();
  }, [email]);
  
  const socket = useRef(null)
  useEffect(()=>{
    socket.current = io(process.env.NEXT_PUBLIC_SERVER_DOMAIN);
    socket.current.on('updateBlocks', (blocks) => {
      if(blocks){
        setTasks(blocks.payload.blocks)
      }
    });
    return ()=>{
      socket.current?.disconnect()}
  }, [])
  useEffect(()=>{
    callbackDeadline(tasks_)
  }, [tasks_])

  const [active_, setActive] = useState(false)
  const [element, setElement] = useState('')
  const [parameter, setParameter] = useState(false)
  const [blockId, setBlockId] = useState()

  function handleDragEnd(event){
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    setTasks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });
  };
  function modal_activation(task, id, index){
    setActive(true);
    setElement(task);
    if(id == 'block'){
      setParameter(false);
    }else{
      setParameter(true);
      setBlockId(index)
    }
  }
  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 20,
    },
  })
);
// MODAL!!!
  const [tasks_id, setTaskObject] = useState()
  const [edit, setEdit] = useState()
  const [object, setObject] = useState()

  function Modal({callBack, setActive}){
    if (!tasks_ || !tasks_[blockId]) return null;
    useEffect(() => {
      if(tasks_[blockId].tasks.title[tasks_id] != undefined){
        setEdit('Edit');
        setObject(tasks_[blockId].tasks)
      }else{
        setEdit('Create');
        setObject(object_title);
      }
  }, [tasks_id, blockId])

  const socket = useRef(null)
  useEffect(() => {
      if (!socket.current) {
          socket.current = io(process.env.NEXT_PUBLIC_SERVER_DOMAIN);
      }
      socket.current.on('updateTasks_', (tasks)=>{
        setTasks(tasks)
      });
      return () => {
          socket.current.off('updateTasks');
      };
  }, []); 

  const handleCreateClick = () => {
    setTaskObject(undefined);
    setObject(object_title);
    setEdit('Create');
  };  
  const [titles, setTitles] = useState('')
  useEffect(()=>{
    setTitles(tasks_[blockId].tasks.title)
  }, [titles]) 

  const [blockName, setBlockName] = useState(null)
  useEffect(()=>{
    setBlockName(tasks_[blockId]?.method)
  }, [tasks_[blockId]?.method])
  const [error, setError] = useState('')
  const deleteBlock=async(email)=>{
    if (blockName===null || blockName === undefined) return null
    setError('')
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/deleteBlock`, {
      method: 'POST',
      credentials:'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({blockName: blockName, email: email, project: rout[1], projectId: projectId})
    });
    let resp = await response.json();
    setError(resp.errors)
    return resp
  }
    const pathname = usePathname()
    const afterProjects = pathname.split('/projects/')[1];
    const handleDelete = async () => {
      const res = await deleteBlock(email);
      
      if (res.errors?.length === 0 || !res.errors) {
        setTimeout(() => setActive(false), 0);
      } else {
        setError(res.errors);
      }
    }
    const [chatOnOff, chatSet] = useState(false)
    const [messages, setMessages] = useState(undefined)
    async function chatActivator(activator){
      if(activator){
        chatSet(activator)
        setMessages(await getMessage('block', projectId, afterProjects, blockId))
      }
    }
    // const chatActivator = useCallback(async(activator)=>{
    //   if(activator){
    //     chatSet(activator)
    //     console.log((1))
    //   }else{
    //     console.log('0')
    //   }
    // })
    return(
    <div className='overlay'>    
      <div className='modal'>
        <div className='task_manager_header'>
          <p className='task_manager_title'>Task manager</p>
          <div className='close' onClick={()=>{setActive(false)}}>
            <Image src={'/images/icons/exit_png.png'} width={30} height={30} alt={'exit'}></Image>
          </div>
        </div>
        <hr></hr>
        <div className='container'>
          <div className='tasks'>
          <div className = 'styler_container'>
              <div className='block_title' style={{color: tasks_[blockId].mood}}><p>{tasks_[blockId].method}</p>
              <Image src ={'/images/icons/chat_0_2.png'} alt={''} height={25} width={30}
              onClick={()=>chatActivator(true)}></Image>
              </div>
              <hr></hr>
                <div className='block_with_tasks'>
                  {Object.values(tasks_[blockId].tasks.title || {}).map((task, index) => {
                  if (!task || task == '') {
                    return null
                  }
                  return(
                  <div className='tasks_' key = {tasks_[blockId].tasks.title[index]+tasks_[blockId].tasks.direction[index]+index} onClick={()=>{setTaskObject(index)}}>
                    <svg width="15" height="15" viewBox="0 0 15 15" style={{margin: '0.8em', marginBottom: '-0.1em'}}>
                      <circle cx="7.5" cy="7.5" r="7.5" fill={tasks_[blockId].mood}/>
                    </svg>
                    <span>{task}</span>
                  </div>)
                  })}
                
                </div>
                <button className='make_create_block' onClick={handleCreateClick}>Create task</button>
                {error && <p style={{fontSize:'0.8em', color: 'red', padding:'0.8em'}}>{error}</p>}
                <button className='make_create_block' onClick={()=>{handleDelete()}}
                style={{backgroundColor: '#fdf3f3', color: 'rgb(180, 0, 0)', border: '1px solid #930000'}}
                >Delete Block</button>
            </div>
            {<TaskDirection edit={edit} object_={object} task_id={tasks_id} mood={tasks_[blockId].mood} email={email} teamsForAssign={callBack} project={afterProjects} block={tasks_[blockId].method}
            blockId = {blockId} projectId = {projectId} chatOnOff = {chatOnOff} chatSet={chatSet} messages={messages}/>}
            {/* set activator for module chats */}
          </div>{/*tasks*/}
        </div>
      </div>
    </div>)
  }
  const pathname = usePathname()
  const afterProjects = pathname.split('/projects/')[1];
  const [teamsForAssign, setTeamsForAssigns] = useState({teams: ''})
  return (
  <>
    {tasks_!==null && (
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={tasks_.map(t => t.id)}>
          <div className='task_content'>
            <SortableItem key={'l1'} id='l'>
              <div className='block'>
                <div 
                  className='task_block' 
                  style={{width: '19em'}} 
                  onClick={() => modal_activation(1, 'block')}
                >
                  <span className='titleBlock' style={{color: '#1B2036'}}>
                    <svg width="15" height="15" viewBox="0 0 15 15" style={{marginRight: '0.5em'}}>
                      <circle cx="7.5" cy="7.5" r="7.5" fill={'#1B2036'}/>
                    </svg>
                    Create block
                  </span>
                </div> 
              </div>
            </SortableItem>
            {tasks_ && tasks_.map((task, index) => (
              <SortableItem key={projectId.id + task.id} id={task.id}>
                <div className='block' onClick={() => {modal_activation(1, 'task', index)}}>
                  <BlockContent 
                    method={task.method} 
                    mood={task.mood} 
                    direction={task.tasks?.direction?.[0] || 'No description'} 
                    developer_list={task.developers} 
                    email={email} 
                    callBackResp={setTeamsForAssigns} 
                    taskId={tasks_id}
                  />
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )}
    
    {parameter === true ? (
      active_ && element && <Modal callBack={teamsForAssign} setActive={setActive} />
    ) : (
      active_ && element && <Modal_Block onClose={() => setActive(false)} email={email} project={afterProjects} projectId={projectId} />
    )}
  </>
)
}

function TaskDirection({edit, object_, task_id, mood, email, teamsForAssign, project, block, projectId, chatOnOff, chatSet, blockId, messages}){
  const [today, setToday] = useState('');
  const today_base = object_?.deadline[task_id]?.start || ''
  
  const [tomorrow, setTomorrow] = useState('')
  const tomorrow_base = object_?.deadline[task_id]?.end || ''
  useEffect(() => {
    if (today_base) {
      setToday(today_base.split('T')[0]);
    } else {
      setToday('');
    }
    
    if (tomorrow_base) {
      setTomorrow(tomorrow_base.split('T')[0]);
    } else {
      setTomorrow('');
    }
  }, [today_base, tomorrow_base]);
  
  const [title, setTitle] = useState(object_?.title?.[task_id] || '');

  const [description, setDescription] = useState(object_?.direction?.[task_id] || '')

  const [error_, setError_] = useState('')
  async function updateTask(email, project, title, description, developers, date, block, task){
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/updateTask`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, project, block, task, title, description, developers, date, projectId})
    })
    let errors = await response.json()
    setError_(errors.errors)
  }
  const createTask = async (email, project, title, direction, developers, deadline, block)=>{
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/create_task`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, project, title, direction, developers, deadline, block, projectId})
    })
    const resp = await response.json()
    if(resp.errors.length>0){
      setError_(resp?.errors?.[0])
    }
    
    return resp
  }
  const createTaskFunction = async(email, project, title, direction, developers, deadline, block)=>{
    const resp = await createTask(email, project, title, direction, developers, deadline, block)
    setError_(resp.errors[0])
  }
  const [employee, setEmployee] = useState({'value': [], 'label': []})
  const [newEmp, setNewEmp] = useState({'value': [], 'label': []});

  useEffect(() => {
      if (!object_ || !object_.developers || task_id === undefined) return;
      
      if (!object_.developers[task_id]) return;
      
      const key = Object.keys(object_.developers[task_id]);
      setEmployee({'value': key, 'label': key}) 
      setNewEmp({'value': key, 'label': key})
      
  }, [object_, task_id])
  
  const callbackData=(workers_)=>{
    if (workers_ === null) return null
    let emp = {value: [], label: []}
      if(employee.value.length>0 && employee.value.length > 0){
        emp = { ...employee }
        workers_.forEach((i)=>{
          if(!emp.value.includes(i.value)){
            emp.value.push(i.value)
          }
        })
        }
      else{
          workers_.forEach((i)=>{
          if(!emp.value.includes(i.value)){
            emp.value.push(i.value)
            emp.label.push(i.label)
          }
          })
        }
    setNewEmp(emp)
  }

  const taskDone = async(email, project, projectId, block, task_id, checkboxStatus) =>{
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/taskDone`,{
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, project, projectId, block, task_id, checkboxStatus})
    })
    let err = await resp.json()
    setError_(err.error)
  }
  const [checked, setChecked] = useState(false)
  useEffect(()=>{
    setChecked(object_?.isChecked?.[task_id] ?? null)
  }, [object_])

  const deleteTask=async(email, projectId, project, block, task_id)=>{
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/deleteTask`,{
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, projectId, project, block, task_id})
    })
    let error = await resp.json()
    setError_(error.errors)
  }
  const deleteEmp = async (emp, index)=>{
    setNewEmp(prev => ({
      value: prev.value.filter((_, i) => i !== index),
      label: prev.label.filter((_, i) => i !== index)
    }));
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/deleteTeamFromTask`, {
      method: 'POST',
      credentials:'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({project, block, task_id, index, projectId, emp})
    })
    const resp_ = await resp.json()
    setError_(resp_.status)
  }
  const [showMore, setShowMore] = useState(false);
  const [emps, setEmps] = useState([])
  return(
    <div className='tasks_direction'>
        {chatOnOff ? <ModalChat deactivation={chatSet} type='block' projectId={projectId} project={project} block={blockId} messages={messages}></ModalChat> : null}
        <p style={{fontWeight: '500', fontSize: '1.4em', margin: '1em', marginBottom: '0.2em', color:'#0e1d49'}}>{edit} task</p>
      <p style={{fontSize:'1em', marginLeft:'1.5em', color:'#575c67'}}>Title</p>
      <input className='inputForm' value={title || ''} onChange={(e)=>{setTitle(e.target.value)}}></input>
      
      <div className='direction_field'>
        <span style={{color: 'red', fontSize:'0.8em', fontFamily:"REM"}}>{error_}</span>
        <div className='direction_'>
          <div style={{display: 'flex', flexDirection:'column'}}>
              <p style={{color:'#575c67'}}>Description</p>
            <textarea type='text' className='direction' value={description} onChange={(e)=>{setDescription(e.target.value)}}></textarea>
          </div>
            <div className='assigness_block'>
              <p>Teams</p>
              <div className='assigness'>
              {newEmp!=undefined && newEmp.value.length>0 ? newEmp.label.slice(0, 5).map((items, index) => {
                  return <div className='member' style={{backgroundColor: mood}} key={projectId.id+index+'d'}><span>
                    {items.length>10 ? items.slice(0, 9)+"..." : items}
                  <Image src='/images/icons/delete_emp.png' width={10} height={10} alt='' style={{marginLeft: '0.3em', cursor: 'pointer'}} onClick={()=>{deleteEmp(items, index)}}></Image></span></div>
              }) : <span style={{color: 'black', width: '100%', whiteSpace: 'word-wrap', position: 'initial'}}>No one here, you can add team.</span>}
              {newEmp.value.length > 5 ? <div style={{display: 'flex', alignItems: 'center', color: '#76789c', width: '7em', height:'1.5em', backgroundColor: '#e9e9f2', borderRadius: '0.5em',
                justifyContent: 'center', cursor:  'pointer'
              }} onMouseEnter={()=>{setEmps(newEmp.value); setShowMore(true)}} onMouseLeave={()=>{setShowMore(false)}}><span>more..</span></div> : ''
              }
              {showMore &&(
                <div style={{width: '13em', height: 'auto', padding: '1em', backgroundColor:'#F8F8FF', borderRadius:'1em',border:'2px solid silver', zIndex: '90', position: 'absolute', marginLeft: '14em', marginTop: '-1em'}} onMouseEnter={()=>{setShowMore(true)}} onMouseLeave={()=>{setShowMore(false)}}>
                  {emps.slice(5).map((i, index)=>{
                    return(<React.Fragment key={i+index} style={{display: 'flex', alignItems:'center'}}><span style={{color: mood}}>{i.length > 15 ? i.slice(0, 15)+'..' : i}</span>
                    <Image src='/images/icons/exit_png.png' width={15} height={16} alt='' style={{marginLeft: '0.2em', cursor: 'pointer', marginTop: '0.5em'}} onClick={()=>{
                      deleteEmp(i, index+3)
                    }}></Image><br></br></React.Fragment>)
                  })}
                </div>
              )}
              </div>
              <GetRoles callback={callbackData} width = {'90%'} value={'Select team'} methods={teamsForAssign.teams} type='checkbox'></GetRoles>
            </div>
        </div>
        {edit === 'Edit'&&(<div style={{display: 'flex', flexDirection: 'row', marginTop: '1em'}}>
          <input type='checkbox' onChange={(e)=>{setChecked(e.target.checked)}} checked={checked} onClick={(e)=>{taskDone(email, project, projectId, block, task_id, e.target.checked)}}></input><span style={{marginLeft:'1em'}}>Task complete</span>
        </div>)}
        
          <div className='date_block'>
            <span className='date_text'>Deadline</span>
            <input className='date' type='date' name='date' value={today}
            onChange={(e) => setToday(e.target.value)}></input>
            <span className='date_text'>To</span>
            <input className='date' type='date' name='date_end' value={tomorrow} onChange={(e) => setTomorrow(e.target.value)}></input>
          </div>

          <div className='block_create'>

           {edit === 'Edit' && (
              <button className='delete_block' onClick={()=>deleteTask(email, projectId, project, block, task_id)}>Delete Task</button>
            )}
            <button className='create_edit_task' onClick={()=>{
              if(edit === 'Create'){
                createTaskFunction(email, project, title, description, employee, {start: today, end: tomorrow}, block)
              }else{
                updateTask(email, project, title, description, newEmp, {start: today, end: tomorrow}, block, task_id)
              }
            }}>{edit} task</button>
          </div>
      </div>
    </div>
  )
}

function BlockContent({method, mood, direction, email, callBackResp, taskId}){
  const path = usePathname()
  let path_ = path.split('/')
    const getAllTeams = async()=>{
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/getTeams`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, project: path_[2], blockName: method, taskId: taskId})
    })
    const resp = await response.json()
    callBackResp(resp)
  }
    return(
        <div className='task_block' onClick={()=>{getAllTeams()}}>
            <span className='titleBlock' style={{color: mood}}><svg width="15" height="15" viewBox="0 0 15 15" style={{marginRight: '0.5em'}}>
  <circle cx="7.5" cy="7.5" r="7.5" fill={mood}/>
</svg>{method}</span>
            <p className='direction_content'>1. {direction}...</p>
        </div> 
    )
}
