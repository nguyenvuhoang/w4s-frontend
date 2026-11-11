import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

import { resolveImportGatewayBaseUrl } from '../../_lib/importValidationProxy'

/** Direct IPS API (not the workflow gateway): returns the apartment import template file. */
const IMPORT_TEMPLATE_DOWNLOAD_PATH = '/ips/api/ImportTemplate/DownloadTemplate'
const APARTMENT_TEMPLATE_CODE = 'APARTMENT'

const getUpstreamError = async (response: Response, fallback: string) => {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
        const payload = await response.json().catch(() => null)
        const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : undefined
        const message = payload?.message ?? payload?.error_message ?? payload?.error ?? firstError?.info ?? firstError?.message
        const execution_id = payload?.execution_id ?? firstError?.execution_id

        return {
            message: typeof message === 'string' && message.trim() ? message.trim() : fallback,
            ...(typeof execution_id === 'string' && execution_id.trim() ? { execution_id: execution_id.trim() } : {})
        }
    }

    return { message: (await response.text().catch(() => '')).trim() || fallback }
}

/**
 * BFF of the apartment import template download: the browser calls this route, the session's backend
 * credential is resolved server side (never sent from / stored in the browser) and the file returned by
 * POST /ips/api/ImportTemplate/DownloadTemplate is streamed back with its own Content-Type / Content-Disposition.
 * A JSON or empty upstream body is never passed on as a file.
 */
export async function POST(request: NextRequest) {
    const fallback = 'Unable to download the apartment import template.'

    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const baseUrl = resolveImportGatewayBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: 'Apartment import template endpoint is not configured.' }, { status: 500 })
        }

        const upstream = await fetch(`${baseUrl}${IMPORT_TEMPLATE_DOWNLOAD_PATH}`, {
            method: 'POST',
            headers: {
                uid: backendCredential.accessToken,
                lang: request.headers.get('lang') ?? 'vi',
                app: request.headers.get('app') ?? process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ template_code: APARTMENT_TEMPLATE_CODE }),
            cache: 'no-store'
        })

        const contentType = upstream.headers.get('content-type') ?? ''

        // A JSON body (even with 200) is an error / result envelope, not the template file.
        if (!upstream.ok || contentType.includes('application/json')) {
            return NextResponse.json(await getUpstreamError(upstream, fallback), { status: upstream.ok ? 502 : upstream.status || 500 })
        }

        const buffer = Buffer.from(await upstream.arrayBuffer())

        if (buffer.byteLength === 0) {
            return NextResponse.json({ message: fallback }, { status: 502 })
        }

        const headers = new Headers({ 'cache-control': 'no-store' })
        const contentDisposition = upstream.headers.get('content-disposition')

        if (contentType) headers.set('content-type', contentType)
        if (contentDisposition) headers.set('content-disposition', contentDisposition)
        headers.set('content-length', String(buffer.byteLength))

        return new Response(buffer, { status: upstream.status, headers })
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : fallback }, { status: 500 })
    }
}
