import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

import { resolveImportGatewayBaseUrl } from '../../_lib/importValidationProxy'

const FEE_TEMPLATE_DOWNLOAD_PATH = '/ips/api/FeeExcelImport/DownloadTemplate'

const getError = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null)
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null
  const message = payload?.message ?? payload?.error_message ?? firstError?.info ?? firstError?.message
  const execution_id = payload?.execution_id ?? payload?.executionId ?? firstError?.execution_id

  return {
    message: typeof message === 'string' && message.trim() ? message.trim() : fallback,
    ...(typeof execution_id === 'string' && execution_id.trim() ? { execution_id: execution_id.trim() } : {})
  }
}

/** Streams the Excel template from the direct IPS endpoint without ever parsing its binary body as JSON. */
export async function GET(request: NextRequest) {
  const fallback = 'Unable to download the fee import template.'

  try {
    const credential = await getBackendToken(request)
    if (!credential) return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })

    const baseUrl = resolveImportGatewayBaseUrl()
    if (!baseUrl) return NextResponse.json({ message: 'Fee import template endpoint is not configured.' }, { status: 500 })

    const upstream = await fetch(`${baseUrl}${FEE_TEMPLATE_DOWNLOAD_PATH}`, {
      method: 'GET',
      headers: {
        uid: credential.accessToken,
        lang: request.headers.get('lang') ?? 'vi',
        app: request.headers.get('app') ?? process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
        'X-TimeZone': request.headers.get('x-timezone') ?? 'Asia/Ho_Chi_Minh',
        ...(request.headers.get('scope')?.trim() ? { scope: request.headers.get('scope')!.trim() } : {})
      },
      cache: 'no-store'
    })
    const contentType = upstream.headers.get('content-type') ?? ''

    if (!upstream.ok || contentType.includes('application/json')) {
      return NextResponse.json(await getError(upstream, fallback), { status: upstream.ok ? 502 : upstream.status || 500 })
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    if (!buffer.byteLength) return NextResponse.json({ message: fallback }, { status: 502 })

    const headers = new Headers({ 'cache-control': 'no-store', 'content-length': String(buffer.byteLength) })
    if (contentType) headers.set('content-type', contentType)
    const disposition = upstream.headers.get('content-disposition')
    if (disposition) headers.set('content-disposition', disposition)

    return new Response(buffer, { status: upstream.status, headers })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : fallback }, { status: 500 })
  }
}
