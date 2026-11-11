import { NextRequest, NextResponse } from 'next/server'
import { getBackendToken } from '@/server/auth/getBackendToken'
import logger from '@lib/logger'

/**
 * Shared proxies for "call the CMS REST gateway, get a JSON result back" endpoints (resident
 * import, fee import, apartment import validate/commit, ...). Each caller keeps its own upstream
 * path, log label and business messages — only the network/parsing/error-normalization plumbing
 * lives here, mirrored 1:1 from the resident import-validate route so every one of these routes
 * behaves the same way. Two variants share the same response handling (sendUpstreamJsonRequest):
 *   - proxyImportValidationRequest: multipart/form-data body (Excel file upload + fields).
 *   - proxyJsonPostRequest: plain JSON body (e.g. the apartment import commit endpoint).
 */

const normalizeBaseUrl = (value?: string) => value?.replace(/\/$/, '')

/** REST gateway base host, with the `/api/v1/gateway` suffix stripped — these upstream import
 *  endpoints live directly under `/ips/api/...`, not under the gateway path. */
export const resolveImportGatewayBaseUrl = (): string => {
    const gatewayUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_REST_API_ENDPOINT)

    if (!gatewayUrl) return ''

    return gatewayUrl.replace(/\/api\/v1\/gateway$/i, '')
}

export type ImportValidationGuardResult = { message: string } | null

/**
 * Sends the already-built upstream request and normalizes whatever comes back into a JSON
 * NextResponse — non-JSON bodies, empty bodies, and business-error envelopes (`success: false` or
 * `status: "ERROR"`) are all handled the same way regardless of which proxy variant called this.
 */
const sendUpstreamJsonRequest = async (
    upstreamUrl: string,
    init: RequestInit,
    logLabel: string,
    parseFailureMessage: string
): Promise<NextResponse> => {
    const upstream = await fetch(upstreamUrl, init)

    const rawResponse = await upstream.text()
    const contentType = upstream.headers.get('content-type') ?? ''

    logger.log(`${logLabel} Upstream raw response:`, rawResponse)

    let payload: any

    try {
        payload = rawResponse
            ? JSON.parse(rawResponse)
            : {
                success: upstream.ok,
                message: upstream.ok ? null : `${logLabel} upstream returned an empty response.`
            }
    } catch (parseError) {
        // A non-JSON upstream body (HTML error page, plain text, ...) must never be swallowed
        // as a generic failure — keep the raw text/status visible so the real backend error
        // is still diagnosable, instead of only ever seeing "invalid JSON".
        logger.error(`${logLabel} Invalid upstream response`, {
            url: upstreamUrl,
            status: upstream.status,
            statusText: upstream.statusText,
            contentType,
            responseBody: rawResponse.slice(0, 5000),
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
        })

        payload = {
            success: false,
            message: parseFailureMessage,
            ...(process.env.NODE_ENV !== 'production'
                ? {
                    upstream_status: upstream.status,
                    upstream_status_text: upstream.statusText,
                    upstream_content_type: contentType,
                    upstream_response: rawResponse.slice(0, 5000)
                }
                : {})
        }
    }

    if (!upstream.ok) {
        logger.error(`${logLabel} Upstream request failed`, {
            url: upstreamUrl,
            status: upstream.status,
            statusText: upstream.statusText,
            contentType,
            responseBody: rawResponse.slice(0, 5000),
            payload
        })
    }

    const isBusinessError =
        payload?.success === false ||
        String(payload?.status ?? '').toUpperCase() === 'ERROR'

    return NextResponse.json(payload, {
        status: isBusinessError ? 422 : upstream.status
    })
}

const buildForwardedHeaders = (request: NextRequest, accessToken: string, extraHeaders: Record<string, string>): Record<string, string> => ({
    uid: accessToken,
    lang: request.headers.get('lang') ?? 'vi',
    app: request.headers.get('app') ?? process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
    'X-TimeZone': request.headers.get('x-timezone') ?? 'Asia/Ho_Chi_Minh',
    ...extraHeaders
})

export type ImportValidationProxyOptions = {
    request: NextRequest
    /** Upstream path appended to the resolved gateway host, e.g. "/ips/api/feeexcelimport/validate". */
    upstreamPath: string
    /** Prefix used on every console log/error emitted by this call, e.g. "[FeeImportValidate]". */
    logLabel: string
    /** Returned as a 500 when NEXT_PUBLIC_REST_API_ENDPOINT isn't configured. */
    notConfiguredMessage: string
    /** Runs before the multipart body is read, against the raw request headers (e.g. resident's required "scope" header). */
    validateHeaders?: (request: NextRequest) => ImportValidationGuardResult
    /** Runs after the multipart body is read, against the parsed form data (e.g. fee's required "project_id" field). */
    validateFormData?: (formData: FormData) => ImportValidationGuardResult
    /** Extra upstream headers beyond the always-forwarded uid/lang/app (e.g. resident's `scope` project header). */
    buildExtraHeaders?: (request: NextRequest, formData: FormData) => Record<string, string>
    /** Message shown to the caller when the upstream body can't be parsed as JSON (raw text/status are still logged and included in non-production responses). */
    parseFailureMessage: string
    /** Message shown to the caller when an unexpected (non-Error) exception is thrown. */
    unexpectedErrorMessage: string
}

export async function proxyImportValidationRequest({
    request,
    upstreamPath,
    logLabel,
    notConfiguredMessage,
    validateHeaders,
    validateFormData,
    buildExtraHeaders,
    parseFailureMessage,
    unexpectedErrorMessage
}: ImportValidationProxyOptions): Promise<NextResponse> {
    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const baseUrl = resolveImportGatewayBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: notConfiguredMessage }, { status: 500 })
        }

        const headerGuardFailure = validateHeaders?.(request)

        if (headerGuardFailure) {
            return NextResponse.json({ success: false, message: headerGuardFailure.message }, { status: 400 })
        }

        const incomingFormData = await request.formData()

        const formGuardFailure = validateFormData?.(incomingFormData)

        if (formGuardFailure) {
            return NextResponse.json({ success: false, message: formGuardFailure.message }, { status: 400 })
        }

        const outgoingFormData = new FormData()

        for (const [key, value] of incomingFormData.entries()) {
            outgoingFormData.append(key, value)
        }

        const upstreamUrl = `${baseUrl}${upstreamPath}`
        const extraHeaders = buildExtraHeaders?.(request, incomingFormData) ?? {}

        return await sendUpstreamJsonRequest(
            upstreamUrl,
            {
                method: 'POST',
                headers: buildForwardedHeaders(request, backendCredential.accessToken, extraHeaders),
                body: outgoingFormData,
                cache: 'no-store'
            },
            logLabel,
            parseFailureMessage
        )
    } catch (error: unknown) {
        logger.error(`${logLabel} Unexpected proxy error`, error)

        const message = error instanceof Error ? error.message : unexpectedErrorMessage

        return NextResponse.json({ success: false, message }, { status: 500 })
    }
}

export type JsonProxyOptions = {
    request: NextRequest
    /** Upstream path appended to the resolved gateway host, e.g. "/ips/api/apartments/import". */
    upstreamPath: string
    /** Prefix used on every console log/error emitted by this call, e.g. "[ApartmentImport]". */
    logLabel: string
    /** Returned as a 500 when NEXT_PUBLIC_REST_API_ENDPOINT isn't configured. */
    notConfiguredMessage: string
    /** Runs after the JSON body is parsed, against the parsed body (e.g. requiring project_id). */
    validateBody?: (body: any) => ImportValidationGuardResult
    /** Runs before the JSON body is parsed, against request headers (e.g. requiring project scope). */
    validateHeaders?: (request: NextRequest) => ImportValidationGuardResult
    /** Extra upstream headers beyond the always-forwarded uid/lang/app. */
    buildExtraHeaders?: (request: NextRequest, body: any) => Record<string, string>
    /** Message shown to the caller when the incoming request body isn't valid JSON. */
    invalidRequestBodyMessage: string
    /** Message shown to the caller when the upstream body can't be parsed as JSON. */
    parseFailureMessage: string
    /** Message shown to the caller when an unexpected (non-Error) exception is thrown. */
    unexpectedErrorMessage: string
}

/**
 * Plain-JSON counterpart of proxyImportValidationRequest — forwards the request body as-is
 * (no workflowid/fields envelope, no multipart), for CMS REST endpoints that take a direct JSON
 * body such as POST /ips/api/apartments/import.
 */
export async function proxyJsonPostRequest({
    request,
    upstreamPath,
    logLabel,
    notConfiguredMessage,
    validateBody,
    validateHeaders,
    buildExtraHeaders,
    invalidRequestBodyMessage,
    parseFailureMessage,
    unexpectedErrorMessage
}: JsonProxyOptions): Promise<NextResponse> {
    try {
        const backendCredential = await getBackendToken(request)

        if (!backendCredential) {
            return NextResponse.json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
        }

        const headerGuardFailure = validateHeaders?.(request)

        if (headerGuardFailure) {
            return NextResponse.json({ success: false, message: headerGuardFailure.message }, { status: 400 })
        }

        const baseUrl = resolveImportGatewayBaseUrl()

        if (!baseUrl) {
            return NextResponse.json({ message: notConfiguredMessage }, { status: 500 })
        }

        const body = await request.json().catch(() => null)

        if (body === null) {
            return NextResponse.json({ success: false, message: invalidRequestBodyMessage }, { status: 400 })
        }

        const bodyGuardFailure = validateBody?.(body)

        if (bodyGuardFailure) {
            return NextResponse.json({ success: false, message: bodyGuardFailure.message }, { status: 400 })
        }

        const upstreamUrl = `${baseUrl}${upstreamPath}`
        const extraHeaders = buildExtraHeaders?.(request, body) ?? {}

        return await sendUpstreamJsonRequest(
            upstreamUrl,
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...buildForwardedHeaders(request, backendCredential.accessToken, extraHeaders)
                },
                body: JSON.stringify(body),
                cache: 'no-store'
            },
            logLabel,
            parseFailureMessage
        )
    } catch (error: unknown) {
        logger.error(`${logLabel} Unexpected proxy error`, error)

        const message = error instanceof Error ? error.message : unexpectedErrorMessage

        return NextResponse.json({ success: false, message }, { status: 500 })
    }
}
