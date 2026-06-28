export async function countData(){
    const resp_proj = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/profileDataCount`, {
        method: 'GET',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'}
    })
    const countProj = await resp_proj.json()
    return countProj
}
export async function editOwner(newEmail){
    const edit_response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/editOwner`,{
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({newEmail})
    })
    return await edit_response.json()
}
export async function deleteOwner(){
    const edit_response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/deleteOwner`,{
        method: 'GET',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'}, 
    })
    return await edit_response.json()
}