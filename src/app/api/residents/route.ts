import { NextResponse } from 'next/server'
import { i18n } from '@/configs/i18n'
import { getBackendToken } from '@/server/auth/getBackendToken'

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

export async function POST(req: Request) {
    try {
        const backendCredential = await getBackendToken(req)

        if (!backendCredential) {
            return NextResponse.json(
                { message: 'Phiên đăng nhập không hợp lệ.' },
                { status: 401 }
            )
        }

        const requestData = await req.json()
        const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

        if (!baseUrl) {
            return NextResponse.json(
                { message: 'Resident API endpoint is not configured.' },
                { status: 500 }
            )
        }

        const response = await fetch(`${baseUrl}/api/residents`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                lang: req.headers.get('lang') || i18n.defaultLocale,
                uid: backendCredential.accessToken,
                app: req.headers.get('app') || process.env.NEXT_PUBLIC_APPLICATION_CODE || 'BO'
            },
            body: JSON.stringify(requestData)
        })

        const payload = await response.json().catch(() => null)

        return NextResponse.json(payload ?? {}, {
            status: response.status,
            statusText: response.statusText
        })
    } catch (error: any) {
        return NextResponse.json(
            { message: error?.message ?? 'Create resident profile failed' },
            { status: 500 }
        )
    }
}
