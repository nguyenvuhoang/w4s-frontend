import { describe, expect, it } from 'vitest'

import { prepareJsonViewerContent } from '@/shared/components/json-view-editor/jsonViewerContent'

import { maskSensitiveValue } from './sensitiveDataMasking'

describe('audit JSON display and clipboard security', () => {
  it('masks nested sensitive fields while preserving complete business data and the original input', () => {
    const source = { password: 'private-password', items: [{ accessToken: 'private-token', total: 1234.56 }], description: 'business '.repeat(100) }
    const content = prepareJsonViewerContent(source, maskSensitiveValue)

    expect(JSON.parse(content.text)).toEqual({ password: '<masked>', items: [{ accessToken: '<masked>', total: 1234.56 }], description: source.description })
    expect(source.password).toBe('private-password')
    expect(content.treeValue).toEqual(JSON.parse(content.text))
  })

  it('masks JSON encoded inside nested string fields', () => {
    const content = prepareJsonViewerContent({ body: '{"password":"private-password","total":42}' }, maskSensitiveValue)

    expect(JSON.parse(JSON.parse(content.text).body)).toEqual({ password: '<masked>', total: 42 })
    expect(content.text).not.toContain('private-password')
  })

  it('keeps the original formatting of nested strings without sensitive data', () => {
    const body = '{\n  "total": 42\n}'
    const content = prepareJsonViewerContent({ body }, maskSensitiveValue)

    expect(JSON.parse(content.text).body).toBe(body)
  })

  it('masks quoted secrets in invalid JSON and plain text', () => {
    const content = prepareJsonViewerContent('{"password": "private password", "total":', maskSensitiveValue)

    expect(content.text).toBe('{"password": "<masked>", "total":')
    expect(content.isJson).toBe(false)
  })

  it('retains existing bearer and JWT masking', () => {
    const content = prepareJsonViewerContent({ message: 'Authorization: Bearer private-token', result: 'abcdefghijk.abcdefghijk.abcdefghijk' }, maskSensitiveValue)

    expect(content.text).not.toContain('private-token')
    expect(content.text).not.toContain('abcdefghijk.abcdefghijk.abcdefghijk')
    expect(content.text).toContain('<masked>')
  })
})
