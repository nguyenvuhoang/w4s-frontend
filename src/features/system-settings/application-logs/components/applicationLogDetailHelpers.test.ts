import { describe, expect, it } from 'vitest'

import { preparePayloadContent } from '@/shared/components/json-view-editor/payloadViewerContent'

import type { ApplicationLogItem } from '../types'
import {
  buildApplicationLogCopyText,
  extractApplicationLogRequestMeta,
  hasApplicationLogPayload
} from './applicationLogDetailHelpers'
import { maskSensitiveText, maskSensitiveValue } from './sensitiveDataMasking'

const baseItem: ApplicationLogItem = {
  id: '1',
  correlation_id: 'trace-1',
  execution_id: null,
  log_timestamp: '2026-10-25T10:00:00Z',
  log_level: 'Error',
  log_type: 'HTTP',
  service_name: 'ips-api',
  direction: 'in',
  flow: null,
  action_name: 'WF_BO_TEST',
  duration: 12,
  message: 'BEGIN REQUEST password=abc123',
  headers: '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghijk","content-type":"application/json"}',
  request: '{"username":"u","password":"p@ss"}',
  response: JSON.stringify(JSON.stringify({ code: 'success', access_token: 'tok-1234567890123' })),
  exception_details: null,
  properties: '{"RequestMethod":"POST","RequestPath":"/api/workflow","Protocol":"HTTP/1.1"}'
}

describe('extractApplicationLogRequestMeta', () => {
  it('reads protocol, method and endpoint from properties regardless of casing', () => {
    expect(extractApplicationLogRequestMeta(baseItem.properties)).toEqual({ protocol: 'HTTP/1.1', method: 'POST', endpoint: '/api/workflow' })
    expect(extractApplicationLogRequestMeta({ request_method: 'GET', path: '/x' })).toEqual({ protocol: null, method: 'GET', endpoint: '/x' })
  })

  it('returns nulls when the log carries no such data', () => {
    expect(extractApplicationLogRequestMeta(null)).toEqual({ protocol: null, method: null, endpoint: null })
    expect(extractApplicationLogRequestMeta('not json')).toEqual({ protocol: null, method: null, endpoint: null })
  })
})

describe('hasApplicationLogPayload', () => {
  it.each([[null, false], ['', false], ['  ', false], ['{}', true], [{ a: 1 }, true], ['text', true]])('%j → %s', (value, expected) => {
    expect(hasApplicationLogPayload(value)).toBe(expected)
  })
})

describe('sensitive data in the detail view', () => {
  it('masks password in request payload and tokens in escaped response payload', () => {
    const request = preparePayloadContent(baseItem.request, { sanitize: maskSensitiveValue, sanitizeText: maskSensitiveText })
    const response = preparePayloadContent(baseItem.response, { sanitize: maskSensitiveValue, sanitizeText: maskSensitiveText })

    expect(request.pretty).not.toContain('p@ss')
    expect(response.kind).toBe('json')
    expect(response.pretty).not.toContain('tok-1234567890123')
  })

  it('masks JSON-like secrets inside malformed (text) payloads', () => {
    const content = preparePayloadContent('{"password":"p@ss", "x":', { sanitize: maskSensitiveValue, sanitizeText: maskSensitiveText })

    expect(content.invalidJson).toBe(true)
    expect(content.pretty).not.toContain('p@ss')
  })

  it('copies the whole log with every sensitive value masked', () => {
    const text = buildApplicationLogCopyText(baseItem)
    const copied = JSON.parse(text)

    expect(text).not.toContain('p@ss')
    expect(text).not.toContain('abc123')
    expect(text).not.toContain('tok-1234567890123')
    expect(text).not.toContain('abcdefghijk')
    expect(copied.request_payload.username).toBe('u')
    expect(copied.response_payload.code).toBe('success')
    expect(copied.exception_details).toBeNull()
  })
})
