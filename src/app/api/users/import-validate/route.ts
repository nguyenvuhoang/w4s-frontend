import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

const STAFF_IMPORT_VALIDATE_PATH = '/cth/api/userexcelimport/validate?DuplicatePolicy=Update'

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

const resolveStaffImportBaseUrl = () => {
    const gatewayUrl = normalizeBaseUrl(process.env.REST_API_ENDPOINT ?? process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

    return gatewayUrl?.replace(/\/api\/v1\/gateway$/i, '') ?? ''
}

const getErrorMessage = (payload: any, fallback: string) => {
    const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse ?? payload
    const firstError = Array.isArray(dataresponse?.errors) ? dataresponse.errors[0] : undefined

    return payload?.message ?? payload?.error ?? dataresponse?.message ?? firstError?.info ?? firstError?.message ?? fallback
}

export async function POST(request: NextRequest) {
    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const incomingFormData = await request.formData()
        const file = incomingFormData.get('File')

        if (!(file instanceof File)) {
            return NextResponse.json({ message: 'File is required.' }, { status: 400 })
        }

        const baseUrl = resolveStaffImportBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: 'Staff import validate endpoint is not configured.' }, { status: 500 })
        }

        const backendFormData = new FormData()

        // Do not set Content-Type: fetch adds the multipart boundary required by CTH.
        backendFormData.append('File', file, file.name)

        const upstream = await fetch(`${baseUrl}${STAFF_IMPORT_VALIDATE_PATH}`, {
            method: 'POST',
            headers: {
                app: 'BO',
                uid: backendCredential.accessToken
            },
            body: backendFormData,
            cache: 'no-store'
        })
        const payload = await upstream.json().catch(() => null)

        if (!upstream.ok || payload?.success === false || String(payload?.status ?? '').toUpperCase() === 'ERROR') {
            return NextResponse.json(
                { message: getErrorMessage(payload, 'Không thể kiểm tra file import nhân viên.') },
                { status: upstream.ok ? 422 : upstream.status || 500 }
            )
        }

        if (!payload) {
            return NextResponse.json({ message: 'Không thể đọc kết quả kiểm tra file import nhân viên.' }, { status: 502 })
        }

        return NextResponse.json(payload, { status: upstream.status })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Không thể kiểm tra file import nhân viên.' },
            { status: 500 }
        )
    }
}
