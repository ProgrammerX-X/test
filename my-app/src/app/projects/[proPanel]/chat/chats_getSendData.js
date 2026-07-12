export const sendMessage = async (message, type, projectId, project, block)=>{
    console.log(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/chat/sendMessage`)
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/chat/sendMessage`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: message, type, projectId, project, block})
    })
    console.log(await resp.json())
}
export const getMessage = async (type, projectId, project, block)=>{
    // console.log(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/chat/sendMessage`)
    
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/chat/getMessage`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({type, projectId, project, block})
    })
    // console.log(await resp.json())
    return await resp.json()
}