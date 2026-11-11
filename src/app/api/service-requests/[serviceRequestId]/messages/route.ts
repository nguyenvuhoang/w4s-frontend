import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { i18n } from '@/configs/i18n'
import type { Locale } from '@/configs/i18n'
import logger from '@lib/logger'
import {
    SERVICE_REQUEST_MESSAGE_CREATE_API_READY,
    ServiceRequestMessagesGatewayError,
    createServiceRequestMessage,
    searchServiceRequestMessages
} from '@/servers/service-requests/serviceRequestMessages.server'
import {
    ServiceRequestAccessError,
    assertServiceRequestAccess
} from '@/servers/service-requests/serviceRequestAccess.server'

const MAX_PAGE_SIZE = 100
const MAX_CONTENT_LENGTH = 4000

const parseServiceRequestId = (raw: string): number | null => {
    const value = Number(raw)

    return Number.isInteger(value) && value > 0 ? value : null
}

const parsePageIndex = (raw: string | null): number => {
    const value = Number(raw)

    return raw !== null && Number.isInteger(value) && value >= 0 ? value : 0
}

const parsePageSize = (raw: string | null): number => {
    const value = Number(raw)

    if (raw === null || !Number.isInteger(value) || value <= 0) return 50

    return Math.min(value, MAX_PAGE_SIZE)
}

const parseLanguage = (raw: string | null): Locale => (
    raw && (i18n.locales as readonly string[]).includes(raw) ? (raw as Locale) : i18n.defaultLocale
)

// This route is authenticated via an httpOnly session cookie (NextAuth), so a cross-site page can
// still make the browser send a POST here with credentials — the project has no CSRF middleware
// (src/proxy.ts explicitly skips everything under /api). Require the Origin header to match this
// request's own origin, same as Next.js's own Server Actions protection. GET is intentionally not
// gated this way — it doesn't mutate state, only cookie-based auth is required to read it.
const isSameOriginRequest = (req: NextRequest): boolean => {
    const origin = req.headers.get('origin')

    if (!origin) return false

    try {
        return new URL(origin).origin === req.nextUrl.origin
    } catch {
        return false
    }
}

const isMessagesGatewayNotReadyError = (error: unknown) => (
    error instanceof Error
    && (
        error.message.includes('Service request messages gateway: REST_API_ENDPOINT is not configured')
        || error.message.includes('REST_API_ENDPOINT is not configured')
        || error.message.includes('Backend endpoint is not configured')
    )
)

const messagesGatewayNotReadyResponse = (error: unknown) => {
    logger.error('Service request messages gateway is not ready:', error)

    return NextResponse.json(
        {
            message: 'Message exchange is not available yet.',
            error_code: 'MESSAGE_GATEWAY_NOT_READY'
        },
        { status: 503 }
    )
}

const errorResponse = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ServiceRequestAccessError) {
        return NextResponse.json(
            { message: error.message, next_action: error.next_action },
            { status: error.status }
        )
    }

    if (isMessagesGatewayNotReadyError(error)) return messagesGatewayNotReadyResponse(error)

    if (error instanceof ServiceRequestMessagesGatewayError) {
        if (
            error.message.includes('REST_API_ENDPOINT is not configured')
            || error.message.includes('Backend endpoint is not configured')
        ) {
            logger.error('Service request messages gateway is not ready:', error)

            return NextResponse.json(
                {
                    message: 'Message exchange is not available yet.',
                    error_code: 'MESSAGE_GATEWAY_NOT_READY'
                },
                { status: 503 }
            )
        }

        return NextResponse.json(
            { message: error.message, next_action: error.next_action, error_code: error.error_code },
            { status: error.status }
        )
    }

    logger.error('❌ Service request messages route failed:', error)

    return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ serviceRequestId: string }> }
) {
    const { serviceRequestId: rawId } = await params
    const serviceRequestId = parseServiceRequestId(rawId)

    if (!serviceRequestId) {
        return NextResponse.json({ message: 'Invalid service request id.' }, { status: 400 })
    }

    const uid = (await getBackendToken(req))?.accessToken

    if (!uid) {
        return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const pageIndex = parsePageIndex(searchParams.get('pageIndex'))
    const pageSize = parsePageSize(searchParams.get('pageSize'))
    const language = parseLanguage(searchParams.get('lang'))

    try {
        // Never trust the :serviceRequestId path param on its own — verify the caller's role has
        // module access and that the id resolves to a real SR before touching the messages workflow.
        await assertServiceRequestAccess({ uid, language, serviceRequestId })

        const result = await searchServiceRequestMessages({
            uid,
            language,
            serviceRequestId,
            pageIndex,
            pageSize
        })

        return NextResponse.json(result, { status: 200 })
    } catch (error) {
        return errorResponse(error, 'Unable to load service request messages.')
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ serviceRequestId: string }> }
) {
    if (!isSameOriginRequest(req)) {
        return NextResponse.json({ message: 'Cross-origin request rejected.' }, { status: 403 })
    }

    const { serviceRequestId: rawId } = await params
    const serviceRequestId = parseServiceRequestId(rawId)

    if (!serviceRequestId) {
        return NextResponse.json({ message: 'Invalid service request id.' }, { status: 400 })
    }

    if (!SERVICE_REQUEST_MESSAGE_CREATE_API_READY) {
        return NextResponse.json({ message: 'The send-message API is not available yet.' }, { status: 501 })
    }

    const uid = (await getBackendToken(req))?.accessToken

    if (!uid) {
        return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!content) {
        return NextResponse.json({ message: 'Message content is required.' }, { status: 400 })
    }

    if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ message: `Message content must be at most ${MAX_CONTENT_LENGTH} characters.` }, { status: 400 })
    }

    const language = parseLanguage(req.nextUrl.searchParams.get('lang'))

    try {
        await assertServiceRequestAccess({ uid, language, serviceRequestId })

        const created = await createServiceRequestMessage({
            uid,
            language,
            serviceRequestId,
            content
        })

        return NextResponse.json(created, { status: 200 })
    } catch (error) {
        return errorResponse(error, 'Unable to send message.')
    }
}
