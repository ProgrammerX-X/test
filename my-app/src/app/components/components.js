import './components.css'
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
    <button className="button buttonGuest" onClick={()=>{enterGuestMode()}}><span style={{padding:'1em'}}>Enter like guest</span></button>
  )
}