'use client'
import {useState} from 'react'
// import 'settings.js'
// async function fetch_(){
//     const res = await fetch('https://jsonplaceholder.typicode.com/posts')
//     // return res.json()
//     // console.log(await res.json())
//     const response = await res.json()
//     return response
// }

// export const metadata = {
//     "title": "TestTitle",
//     "description": "sites description!"
// }
// let res = await fetch_()
// console.log(res)

export default function Donate(){
    const [state, setState] = useState(()=>{
        // console.log('state changed')
    })
    function func(state_){
        return state_+1
    }
    return(
        <div><span>new page for donate later</span>
            {/* {res.map((element_, index)=>(
                <p key={index}>{element_.title}</p>
            ))} */}
            <p>{state}</p>
            <button onClick={func}></button>
        </div>
    )
}