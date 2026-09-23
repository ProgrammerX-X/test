import {ProPanel} from '../list/components'
import { ProfilePage } from './profileComponent'
import { ModalProfileForDeletion } from './profileComponent'
export default function Profile(){
    return(<div style={{display: 'flex', flexDirection: 'row'}}>
        <ProPanel></ProPanel>
        <ProfilePage></ProfilePage>
    </div>)
}
// change password
// delete account