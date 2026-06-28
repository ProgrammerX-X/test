import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { useEffect, useRef, useState } from 'react';
import './gantt.css'
export function Gantt({deadline}) {
  if (!deadline || !Array.isArray(deadline) || deadline.length === 0) return
  const containerRef = useRef(null);
  const [deadlineDone_, setDeadlineDone] = useState([])
  let deadlineDone = []
  let count = 0
  useEffect(()=>{
    deadline.forEach((element) => {
      element.tasks.title.forEach((element_, index_)=>{
        count = count+1;
        deadlineDone.push({id: count, text: element_, start_date: element.tasks.deadline[index_].start, end_date: element.tasks.deadline[index_].end})
      })
    });
    setDeadlineDone(deadlineDone)
  },[deadline])
  useEffect(() => {
    if(deadlineDone_.length==0) return
    gantt.config.xml_date = "%Y-%m-%d %H:%i";
    gantt.config.show_links = false;
    gantt.config.readonly = true;
    gantt.config.details_on_create = true;
    gantt.config.order_branch = true;
    gantt.config.branch_loading = true;
    gantt.config.autosize = "y";
    gantt.config.columns = [
      { name: "text", label: "Task", width: 120 },
      { name: "start_date", label: "Start date", width: 120 }
    ];
    gantt.init(containerRef.current);
    gantt.parse({
      data: deadlineDone_,
      links: [
      ]
    });
  }, [deadlineDone_]);
  
  return (<div style={{ display: 'flex', flexDirection: 'column', width: '100em', height: '32em', overflow: 'auto', marginTop: '-6em'}}>
  <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
</div>)
}