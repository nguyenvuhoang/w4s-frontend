import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Same env + dynamic import pattern as residentDeleteService.test.ts: @/configs/config validates
// these at import time, so they must be set before residentService is loaded.
process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:3000/api'

import type { ResidentPayload } from '../types'
import { buildResidentChangeUsernamePayload, buildResidentUpdateProfilePayload } from '../utils/residentUpdatePayload'

let residentService: typeof import('./residentService').residentService

beforeAll(async () => {
    ({ residentService } = await import('./residentService'))
})

const form: ResidentPayload = {
    resident_code: 'DEMO001',
    user_code: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    full_name: 'Tran Van Test',
    gender: 'M',
    date_of_birth: '1994-08-03',
    phone: '0909888777',
    email: 'test@example.com',
    avatar_url: null,
    identity_number: '083094000634',
    status: 'A',
    nationality: 'VN',
    nationality_country_id: '',
    description: 'Cap nhat ho so'
}

const mockBackendSuccess = () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, errors: [], data: null }),
        text: async () => JSON.stringify({ success: true, errors: [], data: null })
    }) as any
}

const getSentRequestBody = (): { workflowid: string; fields: Record<string, any> } => {
    const [, init] = (global.fetch as any).mock.calls[0]

    return JSON.parse(init.body)
}

describe('residentService.updateResidentProfile — user_code', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('profile update sends fields.user_code at the root, next to resident_code', async () => {
        mockBackendSuccess()

        await residentService.updateResidentProfile(
            buildResidentUpdateProfilePayload(1, form, form.user_code as string),
            { sessiontoken: 'session-token', language: 'vi' }
        )

        const body = getSentRequestBody()

        expect(body.workflowid).toBe('WF_BO_UPDATE_RESIDENT_PROFILE')
        expect(body.fields.id).toBe(1)
        expect(body.fields.resident_code).toBe('DEMO001')
        expect(body.fields.user_code).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        expect(body.fields.owner.user_code).toBe(body.fields.user_code)
        expect('app_account' in body.fields).toBe(false)
    })

    it('change username sends fields.user_code and app_account with only the username', async () => {
        mockBackendSuccess()

        await residentService.updateResidentProfile(
            buildResidentChangeUsernamePayload(1, form, form.user_code as string, 'hoangnv_new'),
            { sessiontoken: 'session-token', language: 'vi' }
        )

        const body = getSentRequestBody()

        expect(body.fields.user_code).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        expect(body.fields.resident_code).toBe('DEMO001')
        expect(body.fields.app_account).toEqual({ username: 'hoangnv_new' })
    })

    it.each(['', '   '])('never calls the workflow when user_code is empty (%j)', async user_code => {
        mockBackendSuccess()

        await expect(
            residentService.updateResidentProfile(
                buildResidentUpdateProfilePayload(1, form, user_code),
                { sessiontoken: 'session-token', language: 'vi' }
            )
        ).rejects.toThrow()

        expect(global.fetch).not.toHaveBeenCalled()
    })
})
