export async function checkLogin(){
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/sender/check`,
        {
            method: 'GET',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'}
        }
    )
    return await resp.json()
}