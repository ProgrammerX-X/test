import './list.css'
// import { usePathname } from 'next/navigation'
export function ProPanel({path}){
    // console.log(path)
    if(path === undefined){
        path = 'teams'
    }
    return(
    <div className='list'>
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