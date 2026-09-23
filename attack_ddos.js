async function test(){
    let request = []
    let href = 'http://localhost:3000/login'
    let body = {email: "HACKED", password: "HACKED"}
    for(let i = 10000; i>0; i--){
        request.push(fetch(href, {
            method:'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        }))
    }
    console.log("DOS start.")
    await Promise.all(request)
    let resp = await fetch(href, {
        method:'POST',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    })
    console.log('Attack ends. All ok.', await resp.json())
}
test()