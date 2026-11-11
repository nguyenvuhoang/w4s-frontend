import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// residentService -> workflowService -> apiPost -> http.ts -> @/configs/config, which validates
// these at import time and throws if missing (they aren't set under vitest). Set them before the
// dynamic import below so module evaluation succeeds — see residentListPagination.test.ts for the
// same pattern.
process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:3000/api'

let residentService: typeof import('./residentService').residentService

beforeAll(async () => {
    ({ residentService } = await import('./residentService'))
})

const mockBackendSuccess = () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, errors: [], data: null }),
        text: async () => JSON.stringify({ success: true, errors: [], data: null })
    }) as any
}

const mockBackendFailure = (execution_id: string, message: string) => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: false, errors: [{ info: message }], execution_id }),
        text: async () => JSON.stringify({ success: false, errors: [{ info: message }], execution_id })
    }) as any
}

const getSentRequestBody = (): { workflowid: string; fields: Record<string, unknown> } => {
    const [, init] = (global.fetch as any).mock.calls[0]

    return JSON.parse(init.body)
}

describe('residentService.deleteResident', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('sends the WF_BO_DELETE_RESIDENT workflow with the exact resident id opened in the URL', async () => {
        mockBackendSuccess()

        await residentService.deleteResident(
            { id: 19415 },
            { sessiontoken: 'session-token', language: 'vi' }
        )

        const body = getSentRequestBody()

        expect(body.workflowid).toBe('WF_BO_DELETE_RESIDENT')
        expect(body.fields).toEqual({ id: 19415 })
    })

    it('throws a workflow error carrying the execution_id when the backend reports failure', async () => {
        mockBackendFailure('exec-987', 'Không thể xóa cư dân đang có căn hộ liên kết.')

        await expect(
            residentService.deleteResident({ id: 19415 }, { sessiontoken: 'session-token', language: 'vi' })
        ).rejects.toMatchObject({
            message: 'Không thể xóa cư dân đang có căn hộ liên kết.',
            executionId: 'exec-987'
        })
    })
})
