import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

const STAFF_EXPORT_PATH = '/cth/api/users/export?DuplicatePolicy=Update&File='

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

const resolveStaffExportBaseUrl = () => {
    const gatewayUrl = normalizeBaseUrl(process.env.REST_API_ENDPOINT ?? process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

    if (!gatewayUrl) return ''

    return gatewayUrl.replace(/\/api\/v1\/gateway$/i, '')
}

const DEFAULT_ERROR_MESSAGE = 'Không thể xuất danh sách nhân viên.'

const getErrorDetails = async (response: Response) => {
    const payload = await response.json().catch(() => null)

    if (!payload) {
        return { message: DEFAULT_ERROR_MESSAGE, executionId: undefined as string | undefined }
    }

    const dataresponse = payload?.dataresponse ?? payload
    const firstError = Array.isArray(dataresponse?.errors) ? dataresponse.errors[0] : undefined
    const executionId = payload?.execution_id ?? payload?.executionId ?? dataresponse?.execution_id ?? dataresponse?.executionId ?? firstError?.execution_id

    return {
        message: String(
            payload?.message
            ?? payload?.error
            ?? dataresponse?.message
            ?? firstError?.info
            ?? firstError?.message
            ?? DEFAULT_ERROR_MESSAGE
        ),
        executionId: executionId ? String(executionId) : undefined
    }
}

export async function POST(request: NextRequest) {
    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const baseUrl = resolveStaffExportBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: 'Staff export endpoint is not configured.' }, { status: 500 })
        }

        // The backend fully owns what gets exported — this proxy never rebuilds a search/filter
        // payload from the request. `{}` is sent only because the shared fetch call needs a body.
        const upstream = await fetch(`${baseUrl}${STAFF_EXPORT_PATH}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                app: request.headers.get('app') ?? process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
                uid: backendCredential.accessToken,
                lang: request.headers.get('lang') ?? 'vi'
            },
            body: JSON.stringify({}),
            cache: 'no-store'
        })

        if (!upstream.ok) {
            const { message, executionId } = await getErrorDetails(upstream)

            return NextResponse.json({ message, execution_id: executionId }, { status: upstream.status || 500 })
        }

        const contentType = upstream.headers.get('content-type') ?? ''

        // The backend can answer 200 OK with a JSON error body instead of the file itself.
        if (contentType.includes('application/json')) {
            const { message, executionId } = await getErrorDetails(upstream)

            return NextResponse.json({ message, execution_id: executionId }, { status: 502 })
        }

        const buffer = Buffer.from(await upstream.arrayBuffer())
        const headers = new Headers({ 'cache-control': 'no-store' })
        const contentDisposition = upstream.headers.get('content-disposition')
        const contentLength = upstream.headers.get('content-length')

        if (contentType) headers.set('content-type', contentType)
        if (contentDisposition) headers.set('content-disposition', contentDisposition)
        if (contentLength) headers.set('content-length', contentLength)

        return new Response(buffer, { status: upstream.status, headers })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE },
            { status: 500 }
        )
    }
}
