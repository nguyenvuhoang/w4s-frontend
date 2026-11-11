import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Behavioral test of the browser-side request() wrapper in http.ts: the secure transport
// (secureFetch) is the only thing mocked; dedup / partitioning / mutation invalidation run for real.
process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
process.env.NEXT_PUBLIC_API_URL ??= 'https://gateway.example.com'

const secureFetch = vi.fn()

vi.mock('@/lib/secure-api/client', () => ({ secureFetch: (...args: unknown[]) => secureFetch(...args) }))

let http: typeof import('./http').default
let store: typeof import('@/@core/stores/useWorkingProjectStore').useWorkingProjectStore

const storage = new Map<string, string>()
const originalWindow = (globalThis as any).window
const originalLocalStorage = (globalThis as any).localStorage

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })

  return { promise, resolve }
}

const ok = (items: unknown[]) => ({ status: 200, data: { dataresponse: { data: { items }, errors: [] } } })

const post = (workflowid: string, fields: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  http.post('/system-service', { workflowid, fields }, {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    headers: { uid: 'client-token', app: 'BO', lang: 'vi', ...headers }
  })

beforeAll(async () => {
  ({ default: http } = await import('./http'))
  ;({ useWorkingProjectStore: store } = await import('@/@core/stores/useWorkingProjectStore'))

  ;(globalThis as any).window = { location: { pathname: '/vi/resident/list', href: 'https://portal.example.com/vi/resident/list' } }
  ;(globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
  }
})

afterAll(() => {
  ;(globalThis as any).window = originalWindow
  ;(globalThis as any).localStorage = originalLocalStorage
})

beforeEach(() => {
  secureFetch.mockReset()
  storage.clear()
})

describe('http request() — browser-side read dedup', () => {
  it('Resident List open under Strict Mode: two identical searches share one network call', async () => {
    const pending = deferred<ReturnType<typeof ok>>()

    secureFetch.mockReturnValue(pending.promise)

    const first = post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7, page_index: 1 })
    const second = post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { page_index: 1, project_id: 7 })

    pending.resolve(ok([{ id: 1 }]))

    const [a, b] = await Promise.all([first, second])

    expect(secureFetch).toHaveBeenCalledTimes(1)
    expect(a).toEqual(b)
    expect(a.payload).not.toBe(b.payload)
  })

  it('different filters / pages are separate requests', async () => {
    secureFetch.mockResolvedValue(ok([]))

    await Promise.all([
      post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7, page_index: 1 }),
      post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7, page_index: 2 })
    ])

    expect(secureFetch).toHaveBeenCalledTimes(2)
  })

  it('project switching: the same search under another project scope is never shared', async () => {
    secureFetch.mockResolvedValue(ok([]))

    await Promise.all([
      post('WF_BO_SIMPLE_SEARCH_BUILDINGS', { project_id: 7 }, { scope: 'PRJ_A' }),
      post('WF_BO_SIMPLE_SEARCH_BUILDINGS', { project_id: 7 }, { scope: 'PRJ_B' })
    ])

    expect(secureFetch).toHaveBeenCalledTimes(2)
  })

  it('different user token: never shared', async () => {
    secureFetch.mockResolvedValue(ok([]))

    await Promise.all([
      post('WF_BO_SIMPLE_SEARCH_BUILDINGS', { project_id: 7 }, { uid: 'user-1' }),
      post('WF_BO_SIMPLE_SEARCH_BUILDINGS', { project_id: 7 }, { uid: 'user-2' })
    ])

    expect(secureFetch).toHaveBeenCalledTimes(2)
  })

  it('mutations are never deduplicated', async () => {
    secureFetch.mockResolvedValue(ok([]))

    await Promise.all([
      post('WF_BO_CREATE_RESIDENT', { name: 'A' }),
      post('WF_BO_CREATE_RESIDENT', { name: 'A' })
    ])

    expect(secureFetch).toHaveBeenCalledTimes(2)
  })

  it('a reload issued after a mutation never joins a search that started before it', async () => {
    const stale = deferred<ReturnType<typeof ok>>()

    secureFetch.mockReturnValueOnce(stale.promise)

    const before = post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })

    secureFetch.mockResolvedValueOnce(ok([]))
    await post('WF_BO_DELETE_RESIDENT', { id: 1 })

    secureFetch.mockResolvedValueOnce(ok([{ id: 2 }]))
    const after = await post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })

    expect(secureFetch).toHaveBeenCalledTimes(3)
    expect(after.payload).toEqual({ dataresponse: { data: { items: [{ id: 2 }] }, errors: [] } })

    stale.resolve(ok([{ id: 1 }]))
    await before
  })

  it('no caching after settlement: Back/refresh revalidation reaches the network again', async () => {
    secureFetch.mockResolvedValue(ok([]))

    await post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })
    await post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })

    expect(secureFetch).toHaveBeenCalledTimes(2)
  })

  it('a failed shared request fails for every caller and the next call retries', async () => {
    secureFetch.mockRejectedValueOnce(new Error('NETWORK_ERROR'))

    const results = await Promise.allSettled([
      post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 }),
      post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })
    ])

    expect(results.map(result => result.status)).toEqual(['rejected', 'rejected'])
    expect(secureFetch).toHaveBeenCalledTimes(1)

    secureFetch.mockResolvedValueOnce(ok([]))
    await expect(post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })).resolves.toMatchObject({ status: 200 })
  })

  it('the READY project scope from the store is sent and partitions requests', async () => {
    secureFetch.mockResolvedValue(ok([]))
    store.setState({ status: 'READY', project: { id: 7, code: 'PRJ_A', name: 'A' } } as any)

    await post('WF_BO_SIMPLE_SEARCH_RESIDENTS', { project_id: 7 })

    const [, , options] = secureFetch.mock.calls[0]

    expect(options.headers.scope).toBe('PRJ_A')
  })
})
