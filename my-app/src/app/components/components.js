export function EnterLikeGuest(){
  const enterGuestMode = async()=>{
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/guest/guestAccess`, {
      method: 'GET',
      headers:{'Content-Type': 'application/json'},
      credentials: "include"
    })
    const redirect = await resp.json()
    if(redirect.redirect){
      window.location.href = redirect.redirect
    }
  }
  return(
    <button style={{width:'25%', fontWeight:'400'}} className="button" onClick={()=>{enterGuestMode()}}>Enter like guest</button>
  )
}