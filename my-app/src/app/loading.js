import {Suspense} from 'react'
import Image from 'next/image'
import './main.css'
export default function Loading(){
    return <LoadSkeleton></LoadSkeleton>
}
function LoadSkeleton(){
    return(
        <div className="loading">
            <Image src = '/images/gifs/load.gif'  alt="loading..." width={250} height={250}></Image>
        </div>
    )
}