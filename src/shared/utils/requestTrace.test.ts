import { describe, expect, it } from 'vitest'

import {
  fingerprintPayload,
  stableStringify,
  summarizeRequestTrace,
  type RequestTraceEntry
} from './requestTrace'

const entry = (overrides: Partial<RequestTraceEntry>): RequestTraceEntry => ({
  requestId: 'rq',
  target: '/system-service WF_BO_SIMPLE_SEARCH_RESIDENTS',
  startedAt: 0,
  durationMs: 100,
  route: '/vi/resident/list',
  caller: 'test',
  fingerprint: 'aaaa',
  cache: 'miss',
  status: 200,
  side: 'client',
  ...overrides
})

describe('fingerprintPayload', () => {
  it('is stable regardless of key order and never contains the raw payload', () => {
    const a = fingerprintPayload({ workflowid: 'WF', fields: { keyword: 'Nguyễn Văn A', page_index: 1 } })
    const b = fingerprintPayload({ fields: { page_index: 1, keyword: 'Nguyễn Văn A' }, workflowid: 'WF' })

    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{8}$/)
    expect(a).not.toContain('Nguy')
  })

  it('differs when a field that changes the response differs', () => {
    expect(fingerprintPayload({ page_index: 1 })).not.toBe(fingerprintPayload({ page_index: 2 }))
  })
})

describe('stableStringify', () => {
  it('sorts nested keys and tolerates circular references', () => {
    const value: Record<string, unknown> = { b: 1, a: { d: 1, c: 2 } }

    value.self = value

    expect(stableStringify(value)).toBe('{"a":{"c":2,"d":1},"b":1,"self":"[Circular]"}')
  })
})

describe('summarizeRequestTrace', () => {
  it('reports duplicates, cache hits, median/p95 and the slowest requests', () => {
    const summary = summarizeRequestTrace([
      entry({ requestId: '1', startedAt: 0, durationMs: 11500 }),
      entry({ requestId: '2', startedAt: 5, durationMs: 11400 }),
      entry({ requestId: '3', target: '/api/code-lists RESIDENT_ROLE', fingerprint: 'bbbb', durationMs: 2300 }),
      entry({ requestId: '4', target: '/api/code-lists RESIDENT_ROLE', fingerprint: 'bbbb', cache: 'hit', durationMs: 0 }),
      entry({ requestId: '5', target: 'other', fingerprint: 'cccc', startedAt: 10000, durationMs: 300 })
    ])

    expect(summary.total).toBe(5)
    expect(summary.network).toBe(4)
    expect(summary.cacheHits).toBe(1)
    expect(summary.duplicates).toEqual([
      { target: '/system-service WF_BO_SIMPLE_SEARCH_RESIDENTS', fingerprint: 'aaaa', count: 2 }
    ])
    expect(summary.slowest[0].requestId).toBe('1')
    expect(summary.medianMs).toBe(2300)
    expect(summary.p95Ms).toBe(11500)
  })
})
