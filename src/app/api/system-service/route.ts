import logger from '@lib/logger'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { withSecureApi } from '@/app/api/_lib/secure-api/server'
import { SecureApiError } from '@/app/api/_lib/secure-api/errors'
import { callSystemServiceBackend } from '@/servers/system-service/callBackend'

export const dynamic = 'force-dynamic'

type JsonRecord = Record<string, unknown>

const createErrorDataResponse = (status: number, message: string) => ({
  error: [
    {
      key: String(status),
      info: message,
      message,
      execute_id: ''
    }
  ]
})

/**
 * Thin Route Handler: decrypt the browser's envelope (withSecureApi) -> resolve the real backend
 * token server-side (getBackendToken, never trusting anything the client sends) -> hand off to
 * callSystemServiceBackend(), the single existing Next.js -> Backend integration shared with the
 * server-side (SSR) call path in src/servers/lib/http.ts. Nothing about the backend URL, headers,
 * body shape or response processing lives here — see src/servers/system-service/callBackend.ts.
 */
export const POST = withSecureApi<JsonRecord, unknown>('/api/system-service', async (requestData, { req, rid }) => {
  const backendCredential = await getBackendToken(req)

  if (!backendCredential) {
    logger.warn('System-service call rejected: no valid server-side session.')

    throw new SecureApiError('Phiên đăng nhập không hợp lệ.', 401, {
      code: 'UNAUTHORIZED',
      success: false,
      message: ['Phiên đăng nhập không hợp lệ.'],
      dataresponse: createErrorDataResponse(401, 'Phiên đăng nhập không hợp lệ.')
    })
  }

  return callSystemServiceBackend(requestData, backendCredential.accessToken, {
    lang: req.headers.get('lang'),
    app: req.headers.get('app'),
    deviceId: req.headers.get('device_id'),
    scope: req.headers.get('scope'),
    userAgent: req.headers.get('user-agent'),
    requestId: req.headers.get('x-request-id') || rid,
    clientSignal: req.signal
  })
})
