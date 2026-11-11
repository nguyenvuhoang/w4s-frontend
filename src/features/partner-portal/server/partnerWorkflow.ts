import 'server-only'

import { cookies } from 'next/headers'
import { workflowService } from '@/servers/system-service'
import type { PartnerApiResult } from '../types'

export const PARTNER_SESSION_COOKIE = 'ips_partner_session'
// Fail closed: demo authentication is only enabled when explicitly requested.
export const partnerDemoMode = process.env.IPS_PARTNER_DEMO_MODE === 'true'

const getData = <T>(response: any): T => response?.payload?.dataresponse?.data?.data ?? response?.payload?.dataresponse?.data ?? response?.data?.data ?? response?.data ?? response

export async function runPartnerWorkflow<T>(workflowid: string | undefined, input: Record<string, unknown>): Promise<PartnerApiResult<T>> {
  if (!workflowid) return { success: false, message: 'Chưa cấu hình workflow backend.' }
  const sessiontoken = (await cookies()).get(PARTNER_SESSION_COOKIE)?.value
  if (!sessiontoken) return { success: false, message: 'Phiên đăng nhập đã hết hạn.' }

  try {
    const response: any = await workflowService.runFODynamic({ sessiontoken, workflowid, input, language: 'vi' })
    if (response?.success === false || response?.payload?.dataresponse?.success === false) {
      return { success: false, message: response?.message ?? response?.payload?.dataresponse?.message ?? 'Không thể xử lý yêu cầu.', executionId: response?.execution_id }
    }
    return { success: true, data: getData<T>(response) }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Không thể kết nối hệ thống IPS.' }
  }
}
