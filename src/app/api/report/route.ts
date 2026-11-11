import { NextRequest, NextResponse } from 'next/server'
import { Agent as UndiciAgent, type Dispatcher, fetch as undiciFetch } from 'undici'
import { env } from '@/env.mjs'
import { getBackendToken } from '@/server/auth/getBackendToken'
import logger from '@lib/logger'

/**
 * BFF proxy for the report viewer (src/views/reports/renderreportdetail.tsx). Previously the
 * browser called NEXT_PUBLIC_REPORT_URI directly with `?token=${session.user.token}` — now that
 * session.user.token is a non-secret marker (see src/auth.ts), that direct call always failed.
 * This route restores the flow WITHOUT ever putting the real backend token in a browser-visible
 * URL: browser -> /api/report (same-origin, no token) -> this route resolves the real token
 * server-side from the HttpOnly session cookie -> report server. The response body is streamed
 * straight back so the existing <iframe src="/api/report?..."> keeps working unchanged.
 *
 * NB: this file previously existed as a Pages Router-style `export default handler(...)`, which
 * the App Router does not execute (no GET/POST export) — it was effectively dead code with no
 * auth and no token attached either way.
 */

export const dynamic = 'force-dynamic'

const REPORT_BASE = env.NEXT_PUBLIC_REPORT_URI
const ALLOW_INSECURE = env.ALLOW_INSECURE_REPORT_SSL === 'true'

function getDispatcher(u: URL): Dispatcher | undefined {
  if (u.protocol !== 'https:' || !ALLOW_INSECURE) return undefined
  return new UndiciAgent({ connect: { rejectUnauthorized: false, servername: u.hostname } })
}

export async function GET(req: NextRequest) {
  const backendCredential = await getBackendToken(req)

  if (!backendCredential) {
    return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  }

  if (!REPORT_BASE) {
    return NextResponse.json({ message: 'NEXT_PUBLIC_REPORT_URI chưa được cấu hình.' }, { status: 500 })
  }

  try {
    const upstream = new URL(REPORT_BASE)

    // Forward the caller's query params as-is (report_code, lang, ...) EXCEPT `token`: that must
    // always be the real, server-resolved credential, never whatever (if anything) the browser sent.
    req.nextUrl.searchParams.forEach((value, key) => {
      if (key === 'token') return
      upstream.searchParams.append(key, value)
    })
    upstream.searchParams.set('token', backendCredential.accessToken)

    const upstreamRes = await undiciFetch(upstream, {
      method: 'GET',
      dispatcher: getDispatcher(upstream),
      headers: {
        accept: req.headers.get('accept') ?? '*/*'
      }
    })

    const buf = Buffer.from(await upstreamRes.arrayBuffer())

    const headers = new Headers({ 'Cache-Control': 'no-store, max-age=0' })
    const contentType = upstreamRes.headers.get('content-type')
    if (contentType) headers.set('Content-Type', contentType)
    const contentDisposition = upstreamRes.headers.get('content-disposition')
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition)
    const contentEncoding = upstreamRes.headers.get('content-encoding')
    if (contentEncoding) headers.set('Content-Encoding', contentEncoding)

    return new NextResponse(buf, { status: upstreamRes.status, headers })
  } catch (error) {
    logger.error('Report proxy error:', error)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 })
  }
}
