import { describe, expect, it } from 'vitest'

import {
  buildDiagnosticReport,
  createBootDiagnostic,
  isRetryableBootError,
  sanitizeDiagnosticText
} from './workspaceBootDiagnostics'

const SENSITIVE = /bearer\s+[a-z0-9]|eyJ|secret-value|sid=123|admin@example\.com|MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA/i
describe('workspaceBootDiagnostics', () => {
  it('redacts tokens, cookies, secrets, e-mails and key blobs, and drops stack lines', () => {
    const raw =
      'Authorization: Bearer abc.def.ghi token=secret-value cookie=sid=123 jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig ' +
      'mail admin@example.com key MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n    at Object.<anonymous> (file.ts:10:5)'

    const clean = sanitizeDiagnosticText(raw)

    expect(clean).not.toBeNull()
    expect(clean).not.toMatch(SENSITIVE)
    expect(clean).not.toContain('at Object')
  })

  it('never synthesizes HTTP status or execution id', () => {
    const diagnostic = createBootDiagnostic({ stage: 'BFF_REQUEST', errorCode: 'NETWORK_ERROR' })

    expect(diagnostic.httpStatus).toBeNull()
    expect(diagnostic.executionId).toBeNull()
    expect(diagnostic.requestId).toBeNull()
    expect(diagnostic.requestSent).toBeNull()
  })

  it('marks session / auth / client-configuration failures as not retryable', () => {
    expect(isRetryableBootError('SESSION_MISSING')).toBe(false)
    expect(isRetryableBootError('AUTHENTICATION_REQUIRED')).toBe(false)
    expect(isRetryableBootError('CLIENT_CONFIGURATION_ERROR')).toBe(false)
    expect(isRetryableBootError('BACKEND_HTTP_ERROR')).toBe(true)
    expect(isRetryableBootError('TIMEOUT')).toBe(true)
  })

  it('builds a copyable report that labels execution id and client request id separately and stays clean', () => {
    const report = buildDiagnosticReport(
      createBootDiagnostic({
        stage: 'BO_CONTEXT',
        errorCode: 'BACKEND_HTTP_ERROR',
        httpStatus: 500,
        executionId: 'exec-1',
        requestId: 'req-1',
        message: 'failed Bearer abc123 for admin@example.com'
      }),
      { environment: 'production', host: 'ips.example.vn', path: '/vi/dashboards', locale: 'vi', attempt: 2 }
    )

    expect(report).toContain('Execution ID (workflow): exec-1')
    expect(report).toContain('Client request ID (x-request-id): req-1')
    expect(report).toContain('HTTP status: 500')
    expect(report).toContain('Environment: production')
    expect(report).not.toMatch(SENSITIVE)
  })
})
