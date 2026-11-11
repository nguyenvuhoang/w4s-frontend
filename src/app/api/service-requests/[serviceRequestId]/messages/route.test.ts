import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', () => ({
    auth: vi.fn()
}))

const { MockServiceRequestAccessError } = vi.hoisted(() => ({
    MockServiceRequestAccessError: class MockServiceRequestAccessError extends Error {
        status: 401 | 403 | 404 | 502
        next_action?: string

        constructor(message: string, status: 401 | 403 | 404 | 502, next_action?: string) {
            super(message)
            this.status = status
            this.next_action = next_action
        }
    }
}))

vi.mock('@/servers/service-requests/serviceRequestAccess.server', () => ({
    ServiceRequestAccessError: MockServiceRequestAccessError,
    assertServiceRequestAccess: vi.fn()
}))

const { MockServiceRequestMessagesGatewayError } = vi.hoisted(() => ({
    MockServiceRequestMessagesGatewayError: class MockServiceRequestMessagesGatewayError extends Error {
        status: number
        next_action?: string
        error_code?: string

        constructor(message: string, status: number, next_action?: string, error_code?: string) {
            super(message)
            this.status = status
            this.next_action = next_action
            this.error_code = error_code
        }
    }
}))

vi.mock('@/servers/service-requests/serviceRequestMessages.server', () => ({
    SERVICE_REQUEST_MESSAGE_CREATE_API_READY: false,
    ServiceRequestMessagesGatewayError: MockServiceRequestMessagesGatewayError,
    searchServiceRequestMessages: vi.fn(),
    createServiceRequestMessage: vi.fn()
}))

import { auth } from '@/auth'
import { assertServiceRequestAccess } from '@/servers/service-requests/serviceRequestAccess.server'
import { searchServiceRequestMessages } from '@/servers/service-requests/serviceRequestMessages.server'
import { GET, POST } from './route'

const BASE_URL = 'http://localhost:3000/api/service-requests/2003/messages'
const params = (serviceRequestId: string) => Promise.resolve({ serviceRequestId })

const authedSession = { user: { token: 'valid-uid-token' } } as any

describe('GET /api/service-requests/[serviceRequestId]/messages', () => {
    beforeEach(() => {
        vi.mocked(auth).mockReset()
        vi.mocked(assertServiceRequestAccess).mockReset()
        vi.mocked(searchServiceRequestMessages).mockReset()
    })

    it('returns 401 when there is no session (not logged in)', async () => {
        vi.mocked(auth).mockResolvedValue(null as any)

        const res = await GET(new NextRequest(`${BASE_URL}?pageIndex=0&pageSize=50`), { params: params('2003') })

        expect(res.status).toBe(401)
        expect(assertServiceRequestAccess).not.toHaveBeenCalled()
    })

    it('returns 400 for a non-numeric service request id', async () => {
        vi.mocked(auth).mockResolvedValue(authedSession)

        const res = await GET(new NextRequest(`${BASE_URL}?pageIndex=0&pageSize=50`), { params: params('abc') })

        expect(res.status).toBe(400)
        expect(assertServiceRequestAccess).not.toHaveBeenCalled()
    })

    it('returns 200 with mapped messages when the user is authorized and the id is valid', async () => {
        vi.mocked(auth).mockResolvedValue(authedSession)
        vi.mocked(assertServiceRequestAccess).mockResolvedValue({ id: 2003, request_type: 'SR' } as any)
        vi.mocked(searchServiceRequestMessages).mockResolvedValue({
            items: [{ id: 1, sender_type: 'RESIDENT', content: 'hello', sent_on_utc: null }],
            total_count: 1,
            page_index: 0,
            page_size: 50,
            has_next_page: false
        })

        const res = await GET(new NextRequest(`${BASE_URL}?pageIndex=0&pageSize=50`), { params: params('2003') })
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.items).toHaveLength(1)
        expect(assertServiceRequestAccess).toHaveBeenCalledWith(
            expect.objectContaining({ uid: 'valid-uid-token', serviceRequestId: 2003 })
        )
    })

    it('returns 403 when the user is authenticated but not authorized for this service request', async () => {
        vi.mocked(auth).mockResolvedValue(authedSession)
        vi.mocked(assertServiceRequestAccess).mockRejectedValue(
            new MockServiceRequestAccessError('You do not have permission to access this service request.', 403)
        )

        const res = await GET(new NextRequest(`${BASE_URL.replace('2003', '9999')}?pageIndex=0&pageSize=50`), { params: params('9999') })

        expect(res.status).toBe(403)
        expect(searchServiceRequestMessages).not.toHaveBeenCalled()
    })

    it('returns 404 when the service request id does not exist', async () => {
        vi.mocked(auth).mockResolvedValue(authedSession)
        vi.mocked(assertServiceRequestAccess).mockRejectedValue(
            new MockServiceRequestAccessError('Service request not found.', 404)
        )

        const res = await GET(new NextRequest(`${BASE_URL}?pageIndex=0&pageSize=50`), { params: params('2003') })

        expect(res.status).toBe(404)
        expect(searchServiceRequestMessages).not.toHaveBeenCalled()
    })
})

describe('POST /api/service-requests/[serviceRequestId]/messages', () => {
    beforeEach(() => {
        vi.mocked(auth).mockReset()
    })

    it('rejects a cross-origin request before checking auth', async () => {
        const req = new NextRequest(BASE_URL, {
            method: 'POST',
            headers: { origin: 'https://evil.example.com', 'content-type': 'application/json' },
            body: JSON.stringify({ content: 'hi' })
        })

        const res = await POST(req, { params: params('2003') })

        expect(res.status).toBe(403)
        expect(auth).not.toHaveBeenCalled()
    })

    it('returns 501 (send API not ready) for a same-origin request, without leaking spoofed fields', async () => {
        const req = new NextRequest(BASE_URL, {
            method: 'POST',
            headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
            body: JSON.stringify({ content: 'hi', workflowId: 'FAKE', user_code: 'admin', sender_type: 'ADMIN' })
        })

        const res = await POST(req, { params: params('2003') })

        expect(res.status).toBe(501)
        // The send-message workflow is not confirmed live yet — 501 must win even before auth runs.
        expect(auth).not.toHaveBeenCalled()
    })
})
