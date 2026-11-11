import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

const RESIDENT_EXPORT_PATH = '/ips/api/residentexport/export'

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

const resolveResidentExportBaseUrl = () => {
    const gatewayUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

    return gatewayUrl?.replace(/\/api\/v1\/gateway$/i, '') ?? ''
}

export async function POST(request: NextRequest) {
    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const baseUrl = resolveResidentExportBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: 'Resident export endpoint is not configured.' }, { status: 500 })
        }

        const body = await request.json().catch(() => null)

        if (!body || !Array.isArray(body.project_codes) || !body.project_codes.every((code: unknown) => typeof code === 'string')) {
            return NextResponse.json({ message: 'Invalid resident export request.' }, { status: 400 })
        }

        const deviceId = request.headers.get('device_id')
        const upstream = await fetch(`${baseUrl}${RESIDENT_EXPORT_PATH}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                uid: backendCredential.accessToken,
                lang: request.headers.get('lang') ?? 'vi',
                app: request.headers.get('app') ?? process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
                scope: request.headers.get('scope') ?? '',
                my_device: JSON.stringify({ device_id: deviceId ?? '' })
            },
            body: JSON.stringify({ project_codes: body.project_codes }),
            cache: 'no-store'
        })

        if (!upstream.ok) {
            const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8'
            const errorBody = await upstream.arrayBuffer()

            return new Response(errorBody, { status: upstream.status, headers: { 'content-type': contentType } })
        }

        const headers = new Headers({ 'cache-control': 'no-store' })

        for (const headerName of ['content-type', 'content-disposition', 'content-length']) {
            const value = upstream.headers.get(headerName)
            if (value) headers.set(headerName, value)
        }

        return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Unable to export resident list.' },
            { status: 500 }
        )
    }
}
