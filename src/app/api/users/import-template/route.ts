import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

const STAFF_IMPORT_TEMPLATE_PATH = '/cth/api/userexcelimport/downloadtemplate?format=excel'

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

const resolveStaffImportBaseUrl = () => {
    const gatewayUrl = normalizeBaseUrl(process.env.REST_API_ENDPOINT ?? process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

    if (!gatewayUrl) return ''

    return gatewayUrl.replace(/\/api\/v1\/gateway$/i, '')
}

const getErrorMessage = async (response: Response) => {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
        const payload = await response.json().catch(() => ({}))
        const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : undefined

        return payload?.message ?? payload?.error ?? firstError?.info ?? firstError?.message ?? 'Không thể tải file mẫu import nhân viên.'
    }

    return (await response.text().catch(() => '')).trim() || 'Không thể tải file mẫu import nhân viên.'
}

export async function POST(request: NextRequest) {
    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const baseUrl = resolveStaffImportBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: 'Staff import template endpoint is not configured.' }, { status: 500 })
        }

        const upstream = await fetch(`${baseUrl}${STAFF_IMPORT_TEMPLATE_PATH}`, {
            method: 'POST',
            headers: {
                app: 'BO',
                uid: backendCredential.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}),
            cache: 'no-store'
        })

        if (!upstream.ok) {
            return NextResponse.json({ message: await getErrorMessage(upstream) }, { status: upstream.status || 500 })
        }

        const buffer = Buffer.from(await upstream.arrayBuffer())
        const headers = new Headers({ 'cache-control': 'no-store' })
        const contentType = upstream.headers.get('content-type')
        const contentDisposition = upstream.headers.get('content-disposition')
        const contentLength = upstream.headers.get('content-length')

        if (contentType) headers.set('content-type', contentType)
        if (contentDisposition) headers.set('content-disposition', contentDisposition)
        if (contentLength) headers.set('content-length', contentLength)

        return new Response(buffer, { status: upstream.status, headers })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Không thể tải file mẫu import nhân viên.' },
            { status: 500 }
        )
    }
}
