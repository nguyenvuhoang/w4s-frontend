import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'
import { encrypt } from '@utils/O9Extension'

export async function changePassword(
  sessionToken: string,
  username: string,
  oldPassword: string,
  newPassword: string
) {
  const encryptedPassword = encrypt(`${username}_${oldPassword}`)
  const encryptedNewPassword = encrypt(`${username}_${newPassword}`)

  const response = await workflowService.runFODynamic({
    sessiontoken: sessionToken,
    workflowid: WORKFLOWCODE.WF_BO_CHANGE_PASSWORD,
    input: {
      oldPassword: encryptedPassword,
      password: encryptedNewPassword
    }
  })

  return response
}

export default { changePassword }

