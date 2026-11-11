import { beforeEach, describe, expect, it, vi } from 'vitest'

// http.ts (reached through boContextService's real module, kept for BoContextError) validates
// these at import time — see src/shared/services/boContextService.test.ts for the same pattern.
vi.hoisted(() => {
    process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
    process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
})

// Keep the real ProjectScopeSyncError class (the store checks instanceof), mock only the fetches.
vi.mock('@/shared/services/workingProjectScope', async importOriginal => ({
    ...(await importOriginal<typeof import('@/shared/services/workingProjectScope')>()),
    synchronizeWorkingProjectScope: vi.fn().mockResolvedValue(undefined),
    clearWorkingProjectScope: vi.fn().mockResolvedValue(undefined)
}))

const { BoContextError, boContextService } = await import('@/shared/services/boContextService')
const { useWorkingProjectStore } = await import('./useWorkingProjectStore')

// The store calls boContextService.getContext at call time, so spying on the shared object is
// enough — no network, and BoContextError stays the real class the store checks against.
const getContext = vi.spyOn(boContextService, 'getContext')

const timeoutError = () =>
    new BoContextError({ message: 'Gateway Timeout. Vui lòng thử lại sau.', httpStatus: 504, serviceUnavailable: true })

const readyContext = {
    userCode: 'U001',
    isSuperAdmin: false,
    projects: [{ id: 1, code: 'P1', name: 'Project 1' }]
}

const init = () => useWorkingProjectStore.getState().initialize({ sessiontoken: 'valid-session', language: 'vi' })

describe('useWorkingProjectStore — WF_BO_GET_BO_CONTEXT unavailable', () => {
    beforeEach(() => {
        getContext.mockReset()
        useWorkingProjectStore.getState().reset()
    })

    it('moves to SERVICE_UNAVAILABLE (not ERROR) on a 504 timeout', async () => {
        getContext.mockRejectedValueOnce(timeoutError())

        await init()

        expect(useWorkingProjectStore.getState().status).toBe('SERVICE_UNAVAILABLE')
        expect(useWorkingProjectStore.getState().retrying).toBe(false)
    })

    it('keeps a non-availability failure as ERROR', async () => {
        getContext.mockRejectedValueOnce(new BoContextError({ message: 'System error occurred.', executionId: 'exec-1' }))

        await init()

        expect(useWorkingProjectStore.getState().status).toBe('ERROR')
        expect(useWorkingProjectStore.getState().errorReference).toBe('exec-1')
    })

    it('retry stays on the unavailable page while in flight, then leaves it on success', async () => {
        getContext.mockRejectedValueOnce(timeoutError())
        await init()

        let resolveRetry!: (value: typeof readyContext) => void
        getContext.mockReturnValueOnce(new Promise<typeof readyContext>(resolve => { resolveRetry = resolve }))

        const retry = init()

        expect(useWorkingProjectStore.getState().status).toBe('SERVICE_UNAVAILABLE')
        expect(useWorkingProjectStore.getState().retrying).toBe(true)

        // A second click while in flight reuses the same request — never two in parallel.
        void init()
        expect(getContext).toHaveBeenCalledTimes(2)

        resolveRetry(readyContext)
        await retry

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('REQUIRE_SELECTION')
        expect(state.userCode).toBe('U001')
        expect(state.retrying).toBe(false)
    })

    it('stays SERVICE_UNAVAILABLE (retry allowed again) when the retry times out too', async () => {
        getContext.mockRejectedValueOnce(timeoutError())
        await init()

        getContext.mockRejectedValueOnce(timeoutError())
        await init()

        expect(useWorkingProjectStore.getState().status).toBe('SERVICE_UNAVAILABLE')
        expect(useWorkingProjectStore.getState().retrying).toBe(false)
        expect(getContext).toHaveBeenCalledTimes(2)
    })
})
