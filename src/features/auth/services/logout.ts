import type { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'
import { getInfoByToken } from '@utils/getInfoByToken'

export type BackendLogoutResult = {
  success: boolean
  execution_id?: string
}

/**
 * Resolves the current user's login_name for the WF_BO_LOGOUT call.
 * Prefers AppContext.userInfo.login_name (already used for permission identity),
 * and falls back to decoding it from the backend JWT when AppContext isn't
 * populated yet (e.g. on the standalone /logout page).
 */
export function resolveLoginName(
  loginNameFromContext: string | null | undefined,
  sessionToken: string | null | undefined
): string | null {
  if (loginNameFromContext) return loginNameFromContext
  if (!sessionToken) return null

  return (
    getInfoByToken(sessionToken, 'login_name') ??
    getInfoByToken(sessionToken, 'username') ??
    null
  )
}

/**
 * Calls WF_BO_LOGOUT to invalidate the session on the backend.
 * Must be called BEFORE the Next.js/NextAuth session is cleared, otherwise
 * the token needed for this call is already gone.
 *
 * Never throws — a failed/timed-out backend logout must not prevent the
 * frontend session from being cleared.
 */
export async function performBackendLogout(
  sessionToken: string | null | undefined,
  loginName: string | null | undefined,
  language?: Locale
): Promise<BackendLogoutResult> {
  if (!sessionToken || !loginName) {
    return { success: false }
  }

  try {
    const response = await workflowService.runFODynamic({
      sessiontoken: sessionToken,
      workflowid: WORKFLOWCODE.WF_BO_LOGOUT,
      input: { login_name: loginName },
      language
    })

    const payload = response?.payload as any
    const success = payload?.success === true && payload?.data?.data === true

    if (!success) {
    }

    return { success, execution_id: payload?.execution_id }
  } catch {
    return { success: false }
  }
}
