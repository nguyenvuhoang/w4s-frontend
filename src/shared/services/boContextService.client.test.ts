import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Browser path of boContextService.getContext: http.ts -> secureFetch('/api/system-service').
// vitest runs in node, so a minimal window/localStorage is stubbed BEFORE the modules load, and
// secureFetch (the encrypted transport) is mocked to return exactly what the BFF would.
const { secureFetchMock, storage } = vi.hoisted(() => {
    process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
    process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
    process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:3000/api'
    process.env.NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64 = 'dGVzdC1wdWJsaWMta2V5'

    const data = new Map<string, string>()
    const localStorageStub = {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, String(value)),
        removeItem: (key: string) => void data.delete(key),
        clear: () => data.clear(),
        key: (index: number) => Array.from(data.keys())[index] ?? null,
        get length() {
            return data.size
        }
    }

    ;(globalThis as any).window = { location: { pathname: '/vi/dashboards', href: 'https://portal.example.com/vi/dashboards', replace: () => undefined }, localStorage: localStorageStub }
    ;(globalThis as any).localStorage = localStorageStub

    return { secureFetchMock: vi.fn(), storage: localStorageStub }
})

vi.mock('@/lib/secure-api/client', () => ({ secureFetch: secureFetchMock }))
vi.mock('@utils/maintenance', () => ({ redirectToMaintenance: vi.fn() }))

let boContextService: typeof import('./boContextService').boContextService

beforeAll(async () => {
    ({ boContextService } = await import('./boContextService'))
})

afterAll(() => {
    delete (globalThis as any).window
    delete (globalThis as any).localStorage
})

const call = () => boContextService.getContext({ sessiontoken: 'ips-session-active', language: 'vi' })

describe('boContextService.getContext — browser path diagnostics', () => {
    beforeEach(() => {
        secureFetchMock.mockReset()
        storage.clear()
        process.env.NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64 = 'dGVzdC1wdWJsaWMta2V5'
    })

    it('sends a client x-request-id and returns the context on success', async () => {
        secureFetchMock.mockResolvedValueOnce({
            status: 200,
            ok: true,
            data: { dataresponse: { success: true, data: { user_code: 'ADMIN', is_super_admin: true, projects: [] } } }
        })

        await expect(call()).resolves.toEqual({ userCode: 'ADMIN', isSuperAdmin: true, projects: [] })

        const headers = secureFetchMock.mock.calls[0][2].headers as Record<string, string>

        expect(headers['x-request-id']).toEqual(expect.any(String))
        expect(headers['x-request-id'].length).toBeGreaterThan(0)
    })

    it('classifies a BFF-level rejection (secure-api key id) as BFF_REJECTED, not a backend error', async () => {
        secureFetchMock.mockResolvedValueOnce({
            status: 400,
            ok: false,
            data: null,
            error: { success: false, message: 'Unknown key id.', code: 'SECURE_API_UNKNOWN_KEY_ID' }
        })

        const error = await call().catch(err => err)

        expect(error).toMatchObject({
            name: 'BoContextError',
            stage: 'BFF_REQUEST',
            errorCode: 'BFF_REJECTED',
            httpStatus: 400,
            message: 'Unknown key id.',
            requestSent: true,
            responseReceived: true
        })
        expect(error.executionId).toBeUndefined()
        expect(error.requestId).toEqual(expect.any(String))
    })

    it('classifies a network failure (BFF never answered) as NETWORK_ERROR without an HTTP status', async () => {
        secureFetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

        await expect(call()).rejects.toMatchObject({
            stage: 'BFF_REQUEST',
            errorCode: 'NETWORK_ERROR',
            httpStatus: undefined,
            serviceUnavailable: true,
            requestSent: true,
            responseReceived: false
        })
    })

    it('times out instead of loading forever when the BFF never responds', async () => {
        vi.useFakeTimers()

        try {
            secureFetchMock.mockReturnValueOnce(new Promise(() => undefined))

            const pending = call().catch(err => err)

            await vi.advanceTimersByTimeAsync(45_000)

            await expect(pending).resolves.toMatchObject({
                errorCode: 'TIMEOUT',
                serviceUnavailable: true,
                httpStatus: undefined,
                responseReceived: false
            })
        } finally {
            vi.useRealTimers()
        }
    })

    it('a retry after a client timeout sends a new request instead of joining the hung one', async () => {
        vi.useFakeTimers()

        try {
            secureFetchMock.mockReturnValueOnce(new Promise(() => undefined))

            const first = call().catch(err => err)

            await vi.advanceTimersByTimeAsync(45_000)
            await first
        } finally {
            vi.useRealTimers()
        }

        secureFetchMock.mockResolvedValueOnce({
            status: 200,
            ok: true,
            data: { dataresponse: { success: true, data: { user_code: 'U001', is_super_admin: false, projects: [] } } }
        })

        await expect(call()).resolves.toMatchObject({ userCode: 'U001' })
        expect(secureFetchMock).toHaveBeenCalledTimes(2)
    })

    it('reports a request that could not be built (missing public key) as never sent', async () => {
        delete process.env.NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64

        await expect(call()).rejects.toMatchObject({
            stage: 'BFF_REQUEST',
            errorCode: 'CLIENT_CONFIGURATION_ERROR',
            requestSent: false,
            retryable: false
        })
        expect(secureFetchMock).not.toHaveBeenCalled()
    })

    it('treats a 2xx non-object body as INVALID_RESPONSE, never as an empty project list', async () => {
        secureFetchMock.mockResolvedValueOnce({ status: 200, ok: false, data: null, error: 'Invalid secure response envelope.' })

        await expect(call()).rejects.toMatchObject({ errorCode: 'INVALID_RESPONSE', responseReceived: true })
    })
})
