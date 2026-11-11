import { NextResponse } from 'next/server'
import { i18n } from '@/configs/i18n'
import { getBackendToken } from '@/server/auth/getBackendToken'

/**
 * BFF route for src/servers/portal-service (loadDataForFormTable, getDetailById). Mirrors
 * /api/system-service: the browser never gets the real backend token — it is resolved here
 * from the server-side session cookie via getBackendToken(), never trusted from a client header.
 */
export async function POST(req: Request) {
  const backendCredential = await getBackendToken(req)

  if (!backendCredential) {
    return NextResponse.json(
      { message: ['Phiên đăng nhập không hợp lệ.'] },
      { status: 401 }
    )
  }

  const requestData = await req.json()

  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/portal-service`

  const response = await fetch(backendUrl, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      lang: req.headers.get('lang') || i18n.defaultLocale,
      app: req.headers.get('app') || 'PORTAL',
      uid: backendCredential.accessToken
    },
    body: JSON.stringify(requestData)
  })

  const payload = await response.json().catch(() => null)

  return NextResponse.json(payload ?? {}, {
    status: response.status,
    statusText: response.statusText
  })
}
