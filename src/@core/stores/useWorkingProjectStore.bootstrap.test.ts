import { beforeEach, describe, expect, it, vi } from 'vitest'

// http.ts (reached through boContextService's real module, kept for BoContextError) validates
// these at import time — same pattern as useWorkingProjectStore.test.ts.
vi.hoisted(() => {
    process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
    process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
})

// Keep the real ProjectScopeSyncError class (the store checks instanceof), mock only the fetches.
vi.mock('@/shared/services/workingProjectScope', async importOriginal => {
    const actual = await importOriginal<typeof import('@/shared/services/workingProjectScope')>()

    return {
        ...actual,
        synchronizeWorkingProjectScope: vi.fn().mockResolvedValue(undefined),
        clearWorkingProjectScope: vi.fn().mockResolvedValue(undefined)
    }
})

const { BoContextError, boContextService } = await import('@/shared/services/boContextService')
const scope = await import('@/shared/services/workingProjectScope')
const { useWorkingProjectStore } = await import('./useWorkingProjectStore')

const getContext = vi.spyOn(boContextService, 'getContext')
const clearScope = vi.mocked(scope.clearWorkingProjectScope)

const init = (sessiontoken: string | undefined = 'ips-session-active') =>
    useWorkingProjectStore.getState().initialize({ sessiontoken, language: 'vi' })

const regularWithProjects = { userCode: 'U001', isSuperAdmin: false, projects: [{ id: 1, code: 'P1', name: 'Project 1' }] }
const superAdminNoProjects = { userCode: 'ADMIN', isSuperAdmin: true, projects: [] }
const superAdminWithProjects = { userCode: 'ADMIN', isSuperAdmin: true, projects: [{ id: 1, code: 'P1', name: 'Project 1' }] }

// Values that must never survive sanitization (labels such as "Bearer"/"cookie" may remain, redacted).
const SENSITIVE = /eyJ|sid=123|ips-session-active|admin@example\.com|bearer\s+[a-z0-9]/i

describe('useWorkingProjectStore — workspace bootstrap diagnostics & recovery', () => {
    beforeEach(() => {
        getContext.mockReset()
        clearScope.mockReset()
        clearScope.mockResolvedValue(undefined)
        useWorkingProjectStore.getState().reset()
    })

    it('workflow success (regular user, no saved project) requires selection and has no diagnostic', async () => {
        getContext.mockResolvedValueOnce(regularWithProjects)

        await init()

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('REQUIRE_SELECTION')
        expect(state.diagnostic).toBeNull()
        expect(state.project).toBeNull()
    })

    it.each([403, 500])('workflow HTTP %i -> ERROR with BO_CONTEXT diagnostic carrying the real status and execution id', async httpStatus => {
        getContext.mockRejectedValueOnce(
            new BoContextError({
                message: 'Backend failure',
                httpStatus,
                executionId: `exec-${httpStatus}`,
                stage: 'BO_CONTEXT',
                errorCode: 'BACKEND_HTTP_ERROR',
                requestId: 'req-1',
                requestSent: true,
                responseReceived: true
            })
        )

        await init()

        const { status, diagnostic, errorReference } = useWorkingProjectStore.getState()

        expect(status).toBe('ERROR')
        expect(errorReference).toBe(`exec-${httpStatus}`)
        expect(diagnostic).toMatchObject({
            stage: 'BO_CONTEXT',
            errorCode: 'BACKEND_HTTP_ERROR',
            httpStatus,
            executionId: `exec-${httpStatus}`,
            requestId: 'req-1',
            retryable: true,
            requestSent: true,
            responseReceived: true
        })
    })

    it('BFF not responding (client timeout) -> SERVICE_UNAVAILABLE, no fabricated HTTP status or execution id', async () => {
        getContext.mockRejectedValueOnce(
            new BoContextError({
                message: 'No response from /api/system-service within 45000ms.',
                serviceUnavailable: true,
                stage: 'BFF_REQUEST',
                errorCode: 'TIMEOUT',
                requestId: 'req-2',
                requestSent: true,
                responseReceived: false
            })
        )

        await init()

        const { status, diagnostic } = useWorkingProjectStore.getState()

        expect(status).toBe('SERVICE_UNAVAILABLE')
        expect(diagnostic).toMatchObject({ stage: 'BFF_REQUEST', errorCode: 'TIMEOUT', httpStatus: null, executionId: null, responseReceived: false })
    })

    it('response without user_code -> ERROR MISSING_USER_CODE, never treated as an empty project list', async () => {
        getContext.mockResolvedValueOnce({ userCode: '', isSuperAdmin: true, projects: [] })

        await init()

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('ERROR')
        expect(state.isSuperAdmin).toBe(false)
        expect(state.diagnostic).toMatchObject({ stage: 'BO_CONTEXT', errorCode: 'MISSING_USER_CODE', httpStatus: null })
    })

    it('project context failure -> ERROR at PROJECT_CONTEXT; retry redoes only the scope sync', async () => {
        getContext.mockResolvedValueOnce(superAdminWithProjects)
        clearScope.mockRejectedValueOnce(
            new scope.ProjectScopeSyncError({ message: 'DELETE /api/project-context returned HTTP 500.', httpStatus: 500, responseReceived: true })
        )

        await init()

        expect(useWorkingProjectStore.getState().status).toBe('ERROR')
        expect(useWorkingProjectStore.getState().diagnostic).toMatchObject({
            stage: 'PROJECT_CONTEXT',
            errorCode: 'PROJECT_SCOPE_SYNC_FAILED',
            httpStatus: 500,
            executionId: null,
            retryable: true
        })

        await init()

        expect(getContext).toHaveBeenCalledTimes(1)
        expect(clearScope).toHaveBeenCalledTimes(2)
        expect(useWorkingProjectStore.getState().status).toBe('READY')
        expect(useWorkingProjectStore.getState().diagnostic).toBeNull()
    })

    it('super admin without any project -> READY with workingProject = null (no fake project)', async () => {
        getContext.mockResolvedValueOnce(superAdminNoProjects)

        await init()

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('READY')
        expect(state.project).toBeNull()
        expect(state.isSuperAdmin).toBe(true)
        expect(state.projects).toEqual([])
    })

    it('super admin with projects but none selected -> READY with workingProject = null', async () => {
        getContext.mockResolvedValueOnce(superAdminWithProjects)

        await init()

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('READY')
        expect(state.project).toBeNull()
        expect(state.projects).toHaveLength(1)
    })

    it('regular user without any project keeps NO_PROJECT_ACCESS', async () => {
        getContext.mockResolvedValueOnce({ userCode: 'U002', isSuperAdmin: false, projects: [] })

        await init()

        expect(useWorkingProjectStore.getState().status).toBe('NO_PROJECT_ACCESS')
    })

    it('clearProject keeps a super admin READY but sends a regular user back to selection', async () => {
        getContext.mockResolvedValueOnce(superAdminWithProjects)
        await init()
        useWorkingProjectStore.getState().clearProject()
        expect(useWorkingProjectStore.getState().status).toBe('READY')

        useWorkingProjectStore.getState().reset()
        getContext.mockResolvedValueOnce(regularWithProjects)
        await init()
        useWorkingProjectStore.getState().clearProject()
        expect(useWorkingProjectStore.getState().status).toBe('REQUIRE_SELECTION')
    })

    it('a failed bootstrap never keeps a previous super admin flag', async () => {
        getContext.mockResolvedValueOnce(superAdminNoProjects)
        await init()
        expect(useWorkingProjectStore.getState().isSuperAdmin).toBe(true)

        getContext.mockRejectedValueOnce(new BoContextError({ message: 'x', stage: 'BO_CONTEXT', errorCode: 'WORKFLOW_ERROR' }))
        await init()

        expect(useWorkingProjectStore.getState().status).toBe('ERROR')
        expect(useWorkingProjectStore.getState().isSuperAdmin).toBe(false)
    })

    it('retry after the backend is fixed recovers and clears the diagnostic', async () => {
        getContext.mockRejectedValueOnce(new BoContextError({ message: 'boom', httpStatus: 500, stage: 'BO_CONTEXT', errorCode: 'BACKEND_HTTP_ERROR' }))
        await init()
        expect(useWorkingProjectStore.getState().status).toBe('ERROR')

        getContext.mockResolvedValueOnce(superAdminNoProjects)
        await init()

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('READY')
        expect(state.diagnostic).toBeNull()
        expect(state.attempt).toBe(2)
        expect(getContext).toHaveBeenCalledTimes(2)
    })

    it('missing client session -> SESSION_CHECK error, request never sent, not retryable', async () => {
        await init('')

        const state = useWorkingProjectStore.getState()

        expect(getContext).not.toHaveBeenCalled()
        expect(state.status).toBe('ERROR')
        expect(state.diagnostic).toMatchObject({
            stage: 'SESSION_CHECK',
            errorCode: 'SESSION_MISSING',
            requestSent: false,
            retryable: false
        })
    })

    it('authentication failure is classified apart from connectivity and does not log out', async () => {
        getContext.mockRejectedValueOnce(
            new BoContextError({ message: 'UNAUTHORIZED', stage: 'SESSION_CHECK', errorCode: 'AUTHENTICATION_REQUIRED', requestSent: true, responseReceived: true })
        )

        await init()

        const state = useWorkingProjectStore.getState()

        expect(state.status).toBe('ERROR')
        expect(state.diagnostic).toMatchObject({ errorCode: 'AUTHENTICATION_REQUIRED', retryable: false })
    })

    it('diagnostics never contain sensitive values even when the backend message does', async () => {
        getContext.mockRejectedValueOnce(
            new BoContextError({
                message: 'Failed for Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc cookie=sid=123 user admin@example.com\n    at stack (file.ts:1:1)',
                httpStatus: 500,
                stage: 'BO_CONTEXT',
                errorCode: 'BACKEND_HTTP_ERROR'
            })
        )

        await init()

        const diagnostic = useWorkingProjectStore.getState().diagnostic

        expect(diagnostic).not.toBeNull()
        expect(JSON.stringify(diagnostic)).not.toMatch(SENSITIVE)
        expect(diagnostic?.message).not.toContain('at stack')
    })
})
