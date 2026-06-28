import { Controller } from "@nestjs/common";
import { SenderMail, jwtAuth } from "./mail.service";
import { Get, Post, Body, Res, Req, Patch, Delete } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import type { Response, Request } from 'express';
// import { SECRET } from "src/pro-panel_handler/pro-panel_handler.controller";
import signature from 'cookie-signature'
// import { getEmails } from "./s";
const SECRET_ = process.env.SECRET || 'rezervSECRET'
@Controller('sender')
export class SenderController {
  constructor(private readonly service: SenderMail, private readonly service_: jwtAuth) {}
  @Post('send_mail')
  async sendEmail(@Body() body: any, @Req() req: any){
    // try{
      const email_validation = /^[^\s@]+@[^\s@]+\.[^\s@]+\S$/
      if (body.email === '' || body.email === null || body.email == undefined || !email_validation.test(body.email)){
        return {error: 'Email do not correct.'}
      }else{
        let token = this.service_.generateToken(body.email, body.project, body.fromEmail)
        let login_token = req.cookies.login
        login_token = signature.unsign(login_token, SECRET_)
        const subject = `${body.fromEmail} invited you in project!`
        const html = `Click <a href = 'http://localhost:3000/sender/${token}'>HERE</a> for meeting <b>${body.project}</b>!`
        const resp = await this.service.sendEmail(body.email, body.project, body.fromEmail, subject, html, login_token)
        return {error: resp.error}
      }
    // }catch(e){
    //   // console.log(e)
    //   return{error: 'Email don`t send. Retry later.', second_err: String(e)}
    // }
  }
  @Cron('*/15 * * * *')
  async cleanExpiredInvites() {
    await this.service.clearInvite()
    await this.service.clearSeed()
  }
  @Post('/confirm')
  async confirmEmail(@Body() body: any){

    let resp = await this.service_.verifyToken(body.token)
    if (resp!='Invalid token'){
      let resp_ = await this.service_.seed(resp.email)
      return {resp: resp.email, project: resp.project, fromEmail: resp.fromEmail, text: 'Mail send!'}
    }else{
      return {error: resp, status: 404}
    }
  }
  @Post('/check')
  async checkPass(@Body() body: any, @Res() res: Response){
  if (body.email != undefined){
      let inData = await this.service_.checkUserInLogin(body.email)
      if(inData === true){
        let resp = await this.service_.checkDB(body.email, body.code, body.project, body.fromEmail)
        if (resp?.status_redirect === true){
          return res.json({redirect: resp?.redirect})
        }else{
          return res.json({resp: resp})
        }
      }else{
        return {redirect: inData.redirect}
      }
  }else{
    return res.json({resp: {text: 'Old token.'}})
  }
  }
  @Post('/getProj')
  async getProjFromElEm(@Body() body: any){
    try{
    const projects = await this.service_.getProjectsAll(body.email)
    if (projects!=null){
      return {resp: projects.directions, emails: projects.emails}
    }else{
      return {resp: '', emails: ''}
    }
    }catch{
      return{resp: '', emails: ''}
    }
  }
  @Post('/get_developers')
  async developers(@Body() body: any){
    const email = body.email
    const path = body.url
// , @Req() req: Request
    let resp = await this.service_.developers_(email, path)
    return {resp: resp}

  }
  @Get('getRoles')
  async getRoles(){
    const resp = await this.service_.getRoles_()
    return{resp: resp}
  }
  @Post('/getEmails')
  async getEmails(@Body() body: any){
    let resp = await this.service_.getEmails(body.team, body.owner)
    // console.log(resp, 95)
    return {method: resp}
  }
  @Post('/addMemberTeam')
  async addMember(@Body() body: any, @Req() req: Request){
    const teamName = body.team
    const owner = body.owner
    const project_name = body.project_name
    const emails = body.emails
    const guest = body.guest
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_)
    let email = req.cookies.email
    email = signature.unsign(email, SECRET_)
    // console.log(email)
    // CHANGED!!!!!!!
    let resp = await this.service_.addMember(teamName, teamName, owner, project_name, emails, guest, body.type, true, token, email, false)
    return {status: 200, error: resp.error}
  }
  @Post('/deleteMember')
  async deleteMember(@Body() body: any, @Req() req: Request){
  let team = body.teamName
  let err = {error: ''}
  let token = req.cookies.login
  token = signature.unsign(token, SECRET_)
  let email = req.cookies.email
  email = signature.unsign(email, SECRET_)
  if (team === 'Unteamed'){
    // err = 
    err = await this.service_.deleteMember(body.teamName, body.owner, body.email, body.project_name, email, token)
  }else{
      // CHANGED!!!!
      err = await this.service_.addMember('Unteamed', body.teamName, body.owner, body.project_name, body.email, body.guest, body.type, false, token, email, true)
  }
    return {status: 200, error: err.error}
  }
  @Post('/edit')
  async editTeam(@Body() body: any, @Req() req: Request){
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_)
    let email = req.cookies.email
    email = signature.unsign(email, SECRET_)

    let l = await this.service_.editTeam(body.title, body.oldTitle, body.owner, body.guest, body.projectName, token, email)
    return {status:"200", error: l?.error}
  }
  @Post('/editRole')
  async editRole(@Body() body: any, @Req() req:Request){
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_)
    let l = await this.service_.editRoles(body.projectName, body.teamName, body.owner, body.roles, body.oldRole, 
      body.email, body.guest, body.emailIndex, token)
    return {status: 200, error: l.error}
  }
  @Post('/deleteTeam')
  async deleteTeam(@Body() body: any, @Req() req:Request){
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_)
    let email = req.cookies.email
    email = signature.unsign(email, SECRET_)
    if(body.teamName != 'Unteamed'){
      let r = await this.service_.deleteTeam(body.teamName, body.projectName, email, token)
      return {status: 200, error: r.error}
    }else{
      return {status: '401', error: 'You can`t do this.'}
    }
  }
  @Post('/getAllEmails')
  async getEmails_all(@Body() body: any){
    let resp = await this.service_.getEmails('Unteamed', body.owner)
    return {resp: resp}
  }
  @Post('/getAllProjects')
  async getAllProjects(@Body() body: any){
    let resp = await this.service_.getProjects_create(body.owner)
    return{projects: resp.projects, error: resp.error}
  }
  @Post('/createTeam')
  async createTeam_(@Body() body: any, @Req() req: Request){
    if(body.owner==undefined || body.title==undefined || body.project==undefined || body.members==undefined){
      return {error: 'Write correct data.'}
    }else{
      let token = req.cookies.login
      token = signature.unsign(token, SECRET_)
      let error = await this.service_.createTeam(body.owner, body.title, body.project, body.members, token)
      // console.log(183, body.members)
      return {error: error.error}
    }
  }
  @Post('/getTeams')
  async getTeams(@Body() body:any){
    const resp = await this.service_.getTeams(body.email, body.project)
    // console.log(resp.teams)
    return {teams: resp.teams}
  }
  @Post('/addTeams')
  async addTeams(@Body() body: any){
    return {status: 200}
  }
  @Post('/deleteBlock')
  async deleteblock(@Body() body: any, @Req() req: Request){
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_)
    let errors = await this.service_.deleteBlock(body.email, body.blockName, body.project, body.projectId, response)
    return {errors: errors}
  }
  @Post('/create_task')
  async createTask(@Body() body: any, @Req() req: Request){
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_)
    let resp = await this.service_.createTask(body.email, body.project, body.title, body.direction, body.developers, body.deadline, body.block, body.projectId, response)
    return{errors: resp}
  }
  @Post('/updateTask')
  async updateTask(@Req() req: Request, @Body() body: any){
    // console.log(body.email, body.project, body.block, body.task, body.title, body.description, body.developers, body.date, body.projectId,
    //   body.oldTitle, body.oldDescription, body.oldDevelopers, body.oldDate
    // )
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_)
    let resp = await this.service_.updateTask(body.email, body.project, body.block, body.task, body.title, body.description, body.developers, body.date, body.projectId, response
    )
    return {errors: resp}
  }
  @Post('/deleteTask')
  async deleteTask(@Req() req:Request, @Body() body: any){
    let response = req.cookies.login
    response = signature.unsign(response, SECRET_)
    let resp = await this.service_.deleteTask(body.email, body.projectId, body.project, body.block, body.task_id, response)
    return {errors: resp}
  }
  @Post('/taskDone')
  async taskD(@Body() body:any, @Req() req: Request){
    // console.log(body.email, body.project, body.projectId, body.block, body.task_id, body.checkboxStatus, 204)
    let token = req.cookies.login
    token = signature.unsign(token, SECRET_)
    let error = await this.service_.taskDone(body.email, body.project, body.projectId, body.block, body.task_id, body.checkboxStatus, token)
    return {error: error.error}
  }
  @Post('deleteTeamFromTask')
  async deleteTeamFromTask(@Body() body: any, @Req() req: Request){
    const email = req.cookies.email
    const token = req.cookies.login
    const emailUnsign = signature.unsign(email, SECRET_)
    const tokenUnsign = signature.unsign(token, SECRET_)
    if(emailUnsign != false && tokenUnsign != false){
    let errors = await this.service_.deleteTeamFromTask(emailUnsign, body.project, body.block, body.task_id, body.index, tokenUnsign, body.projectId, body.emp)
    // console.log(errors, 247)
    return {status: errors.error}}
    else{
      return {status: 400}
    }
  }
  @Get('profileDataCount')
  async dataProjectCount(@Req() req: Request){
    const email = req.cookies.email
    const token = req.cookies.login
    if((email!=undefined && email != null) && (token!=null || token != undefined)){
      const emailUnsign = signature.unsign(email, SECRET_)
      const tokenUnsign = signature.unsign(token, SECRET_)
      if(emailUnsign && tokenUnsign){
        const resp_ = await this.service_.accountData(emailUnsign, tokenUnsign)
        return {status: resp_}
      }else{
        return {status: ['error', 'error!']}
      }
    }else{
      return{status: ['error', '/main_register']}
    }
  }
  @Post('editOwner')
  async editOwner(@Body() body: any, @Req() req: Request){
    const email = req.cookies.email
    const token = req.cookies.login
    if((email!=undefined && email != null) && (token!=null || token != undefined)){
      const emailUnsign = signature.unsign(email, SECRET_)
      const tokenUnsign = signature.unsign(token, SECRET_)
      if(emailUnsign && tokenUnsign){
        const newEmail = body.newEmail
        const resp_ = await this.service_.editOwner(emailUnsign, newEmail, tokenUnsign)
        return {status: resp_}
      }else{
        return {status: ['error', '/main_register']}
      }
    }else{
      return{status: ['error', '/main_register']}
    }
  }
  @Get('/deleteOwner')
  async deleteOwner(@Req() req:Request, @Res({ passthrough: true }) res: Response){
    const email = req.cookies.email
    const token = req.cookies.login
    const cookies = req.cookies || {};
    
    Object.keys(cookies).forEach(cookieName => {
      res.clearCookie(cookieName, { path: '/' });
    });
    if((email!=undefined && email != null) && (token!=null || token != undefined)){
      const emailUnsign = signature.unsign(email, SECRET_)
      const tokenUnsign = signature.unsign(token, SECRET_)
      if(emailUnsign && tokenUnsign){
        const resp = await this.service_.deleteAccount(emailUnsign, tokenUnsign)
        return {status: resp}
      }else{
        return {status: ['error', '/main_register']}
      }
    }else{
      return{status: ['error', '/main_register']}
    }
  }
  @Get('check')
  async checkLogin(@Req() req: Request){
    const cookies_email = req.cookies.email
    const cookies_token = req.cookies.login
    if(cookies_email != undefined && cookies_token != undefined){
      // console.log(cookies_email)
      const email = signature.unsign(cookies_email, SECRET_)
      const token = signature.unsign(cookies_token, SECRET_)
      if(email&&token){
        const access = await this.service_.checkLogin(email, token)
        if(access){
          return {status: 200}
        }else{
          return {status: 429}
        }
      }else{
        return {status: 429}
      }
    }else{
      return {status: 429}
    }
  }
}