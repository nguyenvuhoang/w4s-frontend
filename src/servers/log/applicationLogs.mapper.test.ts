import { describe, expect, it } from 'vitest'

import { mapApplicationLogItem } from './applicationLogs.mapper'

describe('mapApplicationLogItem', () => {
  it('maps request_payload / response_payload from the backend contract', () => {
    const mapped = mapApplicationLogItem({
      id: 42,
      correlation_id: 'trace-1',
      duration_ms: 125,
      message: 'BEGIN REQUEST',
      headers: '{"content-type":"application/json"}',
      request_payload: '{"user_id":"u1"}',
      response_payload: '"{\\"code\\":\\"success\\"}"',
      properties: '{"RequestMethod":"POST"}'
    }, 0)

    expect(mapped.id).toBe('42')
    expect(mapped.duration).toBe(125)
    expect(mapped.request).toBe('{"user_id":"u1"}')
    expect(mapped.response).toBe('"{\\"code\\":\\"success\\"}"')
    expect(mapped.headers).toBe('{"content-type":"application/json"}')
    expect(mapped.properties).toBe('{"RequestMethod":"POST"}')
  })

  it('supports PascalCase and camelCase payload keys', () => {
    expect(mapApplicationLogItem({ Id: 1, RequestPayload: 'a', ResponsePayload: 'b' }, 0)).toMatchObject({ request: 'a', response: 'b' })
    expect(mapApplicationLogItem({ id: 1, requestPayload: { a: 1 }, responsePayload: [1] }, 0)).toMatchObject({ request: { a: 1 }, response: [1] })
  })

  it('keeps object payloads as the same object (no stringify round trip)', () => {
    const request = { nested: { value: 'Tiếng Việt' } }

    expect(mapApplicationLogItem({ id: 1, request_payload: request }, 0).request).toBe(request)
  })

  it('falls back to legacy request/response field names', () => {
    expect(mapApplicationLogItem({ id: 1, request: 'r', response_content: 's' }, 0)).toMatchObject({ request: 'r', response: 's' })
  })

  it('prefers request_payload over message and never derives payloads from message', () => {
    const mapped = mapApplicationLogItem({ id: 1, message: 'REQUEST {"a":1}', request_payload: null }, 0)

    expect(mapped.request).toBeNull()
    expect(mapped.message).toBe('REQUEST {"a":1}')
  })

  it('maps null payloads to null and stack_trace to exception_details', () => {
    const mapped = mapApplicationLogItem({ id: 1, request_payload: null, response_payload: undefined, stack_trace: 'at X' }, 0)

    expect(mapped.request).toBeNull()
    expect(mapped.response).toBeNull()
    expect(mapped.exception_details).toBe('at X')
  })

  it('stringifies a structured message once instead of producing [object Object]', () => {
    expect(mapApplicationLogItem({ id: 1, message: { text: 'hi' } }, 0).message).toBe('{\n  "text": "hi"\n}')
  })
})
