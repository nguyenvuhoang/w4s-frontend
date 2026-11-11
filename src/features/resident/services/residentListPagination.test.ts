import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { empty_resident_filter } from '../components/resident-list/residentListHelpers'
import type { ResidentFilterModel } from '../types'

// residentService -> workflowService -> apiPost -> http.ts -> @/configs/config, which validates
// these at import time and throws if missing (they aren't set under vitest). Set them before the
// dynamic import below so module evaluation succeeds — see src/servers/lib/http.test.ts and
// src/shared/services/boContextService.test.ts for the same pattern.
process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:3000/api'

let residentService: typeof import('./residentService').residentService

beforeAll(async () => {
    ({ residentService } = await import('./residentService'))
})

const buildFilter = (overrides: Partial<ResidentFilterModel> = {}): ResidentFilterModel => ({
    ...empty_resident_filter,
    project_id: 42,
    page_index: 1,
    ...overrides
})

const mockBackendResponse = (body: { items?: unknown[]; total_count?: number; page_index?: number; page_size?: number }) => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
            data: {
                data: {
                    items: body.items ?? [],
                    total_count: body.total_count ?? 0,
                    page_index: body.page_index,
                    page_size: body.page_size ?? 10
                }
            }
        })
    }) as any
}

const getSentPageIndex = (): number => {
    const [, init] = (global.fetch as any).mock.calls[0]
    const body = JSON.parse(init.body)

    return body.fields.page_index
}

const getSentAppUsageFilter = (): boolean | null => {
    const [, init] = (global.fetch as any).mock.calls[0]
    const body = JSON.parse(init.body)

    return body.fields.has_user_code
}

// Regression coverage for the UI (1-based) <-> backend (0-based) page_index convention. The
// conversion lives entirely in residentService.get_residents/mapResidentsSearchResponse
// (unchanged by the navigation-race refactor in useResidentList.ts) — these tests pin it down so
// the hook's normalizeFilter (which only clamps to >= 1, on the UI side) never has to duplicate or
// second-guess it. Per project convention: UI page starts at 1, backend page_index starts at 0,
// default page_size is 10.
describe('residentService.get_residents — UI/backend page_index conversion', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('UI page 1 sends backend page_index 0', async () => {
        mockBackendResponse({ page_index: 0 })

        await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ page_index: 1 })
        })

        expect(getSentPageIndex()).toBe(0)
    })

    it('UI page 2 sends backend page_index 1', async () => {
        mockBackendResponse({ page_index: 1 })

        await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ page_index: 2 })
        })

        expect(getSentPageIndex()).toBe(1)
    })

    it('UI page 5 sends backend page_index 4', async () => {
        mockBackendResponse({ page_index: 4 })

        await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ page_index: 5 })
        })

        expect(getSentPageIndex()).toBe(4)
    })

    it('backend response page_index 0 is surfaced as UI page 1', async () => {
        mockBackendResponse({ page_index: 0, items: [{ id: 1 }] })

        const result = await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ page_index: 1 })
        })

        expect(result.page_index).toBe(1)
    })

    it('backend response page_index 1 is surfaced as UI page 2', async () => {
        mockBackendResponse({ page_index: 1 })

        const result = await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ page_index: 2 })
        })

        expect(result.page_index).toBe(2)
    })

    it('falls back to the (0-based) requested page when the backend omits page_index in its response, still surfaced 1-based', async () => {
        mockBackendResponse({ page_index: undefined })

        const result = await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ page_index: 3 })
        })

        // Requested UI page 3 -> backend page_index 2 -> echoed back (via fallback) -> UI page 3.
        expect(getSentPageIndex()).toBe(2)
        expect(result.page_index).toBe(3)
    })

    it('never clamps below backend page_index 0, even for a defensively out-of-range UI page_index <= 0', async () => {
        mockBackendResponse({ page_index: 0 })

        await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            // Bypasses useResidentList's own normalizeFilter clamp on purpose, to pin down
            // get_residents' own independent floor (Math.max(filter.page_index - 1, 0)).
            filter: buildFilter({ page_index: 0 })
        })

        expect(getSentPageIndex()).toBe(0)
    })
})

describe('residentService.get_residents — app usage mapping', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it.each([
        ['USED', 'USED'],
        [' not_used ', 'NOT_USED'],
        [null, 'UNKNOWN'],
        ['unexpected', 'UNKNOWN']
    ])('maps workflow app_usage %s to %s without deriving it from user_code', async (appUsage, expected) => {
        mockBackendResponse({
            items: [{ id: 1, user_code: 'HAS-ACCOUNT', app_usage: appUsage }],
            page_index: 0
        })

        const result = await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter()
        })

        expect(result.items[0].app_usage).toBe(expected)
    })

    it.each([
        ['USED', true],
        ['NOT_USED', false],
        ['ALL', null]
    ] as const)('sends %s with the existing has_user_code workflow contract', async (appUsage, expected) => {
        mockBackendResponse({ page_index: 0 })

        await residentService.get_residents({
            sessiontoken: 'session-token',
            language: 'vi',
            filter: buildFilter({ app_usage: appUsage })
        })

        expect(getSentAppUsageFilter()).toBe(expected)
    })
})
