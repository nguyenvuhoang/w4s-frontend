import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearInflightRequests,
  dedupeInflight,
  getDynamicWorkflowId,
  getInflightRequestCount,
  isReadOnlyWorkflowId
} from './inflightDedupe'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

afterEach(() => {
  clearInflightRequests()
})

describe('isReadOnlyWorkflowId', () => {
  it.each([
    'WF_BO_SIMPLE_SEARCH_RESIDENTS',
    'WF_BO_SIMPLE_SEARCH_BUILDINGS',
    'WF_BO_GET_BO_CONTEXT',
    'WF_BO_GET_RESIDENT_DETAIL',
    'WF_BO_VIEW_CONTRACT'
  ])('treats %s as read-only', workflowId => {
    expect(isReadOnlyWorkflowId(workflowId)).toBe(true)
  })

  it.each([
    'WF_BO_CREATE_RESIDENT',
    'WF_BO_UPDATE_RESIDENT_PROFILE',
    'WF_BO_DELETE_RESIDENT',
    'WF_BO_IMPORT_RESIDENTS',
    'WF_BO_EXPORT_RESIDENT_LIST',
    'WF_BO_GET_AND_UPDATE_SOMETHING',
    'WF_BO_APPROVE_REQUEST',
    'WF_BO_RESIDENT_PROFILE',
    '',
    undefined,
    42
  ])('never treats %s as read-only', workflowId => {
    expect(isReadOnlyWorkflowId(workflowId)).toBe(false)
  })
})

describe('getDynamicWorkflowId', () => {
  it('reads the workflow id of a { workflowid, fields } body only', () => {
    expect(getDynamicWorkflowId({ workflowid: 'WF_X', fields: {} })).toBe('WF_X')
    expect(getDynamicWorkflowId({ workflowid: 'WF_X' })).toBeNull()
    expect(getDynamicWorkflowId({ bo: [] })).toBeNull()
    expect(getDynamicWorkflowId(null)).toBeNull()
    expect(getDynamicWorkflowId([])).toBeNull()
  })
})

describe('dedupeInflight', () => {
  it('shares one call between two identical overlapping requests (React Strict Mode double effect)', async () => {
    const pending = deferred<{ status: number; payload: { items: number[] } }>()
    const factory = vi.fn(() => pending.promise)
    const onJoin = vi.fn()

    const first = dedupeInflight('k', factory)
    const second = dedupeInflight('k', factory, onJoin)

    pending.resolve({ status: 200, payload: { items: [1, 2] } })

    await expect(first).resolves.toEqual({ status: 200, payload: { items: [1, 2] } })
    await expect(second).resolves.toEqual({ status: 200, payload: { items: [1, 2] } })
    expect(factory).toHaveBeenCalledTimes(1)
    expect(onJoin).toHaveBeenCalledTimes(1)
  })

  it('gives every consumer an independent copy when the request was shared', async () => {
    const pending = deferred<{ items: number[] }>()
    const first = dedupeInflight('k', () => pending.promise)
    const second = dedupeInflight('k', () => pending.promise)

    pending.resolve({ items: [1] })

    const [a, b] = await Promise.all([first, second])

    a.items.push(99)
    expect(b.items).toEqual([1])
  })

  it('does not cache after settlement: a later identical call hits the network again (refresh/revalidation)', async () => {
    const factory = vi.fn(async () => ({ ok: true }))

    await dedupeInflight('k', factory)
    await dedupeInflight('k', factory)

    expect(factory).toHaveBeenCalledTimes(2)
    expect(getInflightRequestCount()).toBe(0)
  })

  it('keeps different keys (other project scope / user / filter) on separate requests', async () => {
    const factory = vi.fn(async () => 'x')

    await Promise.all([dedupeInflight('scope-A', factory), dedupeInflight('scope-B', factory)])

    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('propagates a failure to every joiner and releases the key so the next call retries', async () => {
    const pending = deferred<string>()
    const first = dedupeInflight('k', () => pending.promise)
    const second = dedupeInflight('k', () => pending.promise)

    pending.reject(new Error('boom'))

    await expect(first).rejects.toThrow('boom')
    await expect(second).rejects.toThrow('boom')

    const retry = vi.fn(async () => 'ok')

    await expect(dedupeInflight('k', retry)).resolves.toBe('ok')
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('a request started after clearInflightRequests() (mutation/logout) never joins an older read', async () => {
    const older = deferred<string>()
    const olderFactory = vi.fn(() => older.promise)
    const newerFactory = vi.fn(async () => 'fresh')

    const stale = dedupeInflight('k', olderFactory)

    clearInflightRequests()

    await expect(dedupeInflight('k', newerFactory)).resolves.toBe('fresh')
    expect(newerFactory).toHaveBeenCalledTimes(1)

    older.resolve('stale')
    await expect(stale).resolves.toBe('stale')
  })
})
