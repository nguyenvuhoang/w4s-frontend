import { NextRequest, NextResponse } from 'next/server'
import { getBackendToken } from '@/server/auth/getBackendToken'

const RESIDENT_IMPORT_TEMPLATE_PATH = '/ips/api/residentexcelimport/downloadtemplate'

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

const resolveResidentImportBaseUrl = () => {
    const gatewayUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

    if (!gatewayUrl) return ''

    return gatewayUrl.replace(/\/api\/v1\/gateway$/i, '')
}

export async function POST(req: NextRequest) {
    try {
        const backendCredential = await getBackendToken(req)

        if (!backendCredential) {
            return NextResponse.json(
                { message: 'Phiên đăng nhập không hợp lệ.' },
                { status: 401 }
            )
        }

        const baseUrl = resolveResidentImportBaseUrl()

        if (!baseUrl) {
            return NextResponse.json(
                { message: 'Resident import template endpoint is not configured.' },
                { status: 500 }
            )
        }

        const upstream = await fetch(`${baseUrl}${RESIDENT_IMPORT_TEMPLATE_PATH}`, {
            method: 'POST',
            headers: {
                uid: backendCredential.accessToken,
                lang: req.headers.get('lang') ?? 'vi',
                app: req.headers.get('app') ?? process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            },
            cache: 'no-store'
        })

        if (!upstream.ok) {
            const contentType = upstream.headers.get('content-type') ?? ''
            const errorText = contentType.includes('application/json')
                ? JSON.stringify(await upstream.json().catch(() => ({})))
                : await upstream.text().catch(() => '')

            return new Response(errorText, {
                status: upstream.status,
                headers: {
                    'content-type': contentType || 'text/plain; charset=utf-8'
                }
            })
        }

        const buffer = Buffer.from(await upstream.arrayBuffer())
        const headers = new Headers()
        const contentType = upstream.headers.get('content-type')
        const contentDisposition = upstream.headers.get('content-disposition')
        const contentLength = upstream.headers.get('content-length')

        if (contentType) headers.set('content-type', contentType)
        if (contentDisposition) headers.set('content-disposition', contentDisposition)
        if (contentLength) headers.set('content-length', contentLength)
        headers.set('cache-control', 'no-store')

        return new Response(buffer, {
            status: upstream.status,
            headers
        })
    } catch (error: any) {
        return NextResponse.json(
            { message: error?.message ?? 'Unable to download resident import template.' },
            { status: 500 }
        )
    }
}
