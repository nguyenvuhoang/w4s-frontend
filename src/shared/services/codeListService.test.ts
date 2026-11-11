import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CODE_LIST_CACHE_TTL_MS, CodeListApiError, codeListService } from './codeListService'

const okResponse = (items: unknown[]) => ({
  ok: true,
  json: async () => ({ success: true, data: { items } })
})

const roleItem = { id: 1, code_id: 'OWNER', code_name: 'ROLE', code_group: 'IPS', code_value: 'OWNER', visible: true }

describe('codeListService.getByGroupAndName cache', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    codeListService.invalidate()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  it('makes one request for two concurrent identical lookups (Strict Mode double effect)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([roleItem]))

    global.fetch = fetchMock as any

    const [a, b] = await Promise.all([
      codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' }),
      codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a).toHaveLength(1)
    expect(a).toEqual(b)
    expect(a[0]).not.toBe(b[0])
  })

  it('serves later lookups from cache within the TTL and refetches after it expires', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(okResponse([roleItem]))

    global.fetch = fetchMock as any

    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(CODE_LIST_CACHE_TTL_MS + 1)

    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('partitions the cache by language and by group/name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([roleItem]))

    global.fetch = fetchMock as any

    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'en' })
    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'DEPARTMENT', language: 'vi' })

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('never caches a failure — the next lookup retries', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ success: false, error_message: 'down', execution_id: 'ex-1' }) })
      .mockResolvedValueOnce(okResponse([roleItem]))

    global.fetch = fetchMock as any

    await expect(
      codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    ).rejects.toBeInstanceOf(CodeListApiError)

    await expect(
      codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    ).resolves.toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('force and invalidate bypass the cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([roleItem]))

    global.fetch = fetchMock as any

    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })
    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi', force: true })
    codeListService.invalidate({ code_group: 'IPS', code_name: 'RESIDENT_ROLE' })
    await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('returns copies so a consumer mutating items cannot corrupt the cache', async () => {
    global.fetch = vi.fn().mockResolvedValue(okResponse([roleItem])) as any

    const first = await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })

    first[0].caption = 'mutated'

    const second = await codeListService.getByGroupAndName({ code_group: 'IPS', code_name: 'RESIDENT_ROLE', language: 'vi' })

    expect(second[0].caption).toBeNull()
  })
})
