import { describe, expect, it } from 'vitest'

import {
  PAYLOAD_HIGHLIGHT_CHAR_LIMIT,
  buildPayloadLines,
  decodePayload,
  preparePayloadContent,
  splitTokensIntoLines,
  tokenizeLogText
} from './payloadViewerContent'

describe('decodePayload', () => {
  it('parses a JSON string payload', () => {
    expect(decodePayload('{"a":1,"b":[true,null]}')).toEqual({ kind: 'json', value: { a: 1, b: [true, null] }, invalidJson: false })
  })

  it('unwraps escaped (double encoded) JSON strings', () => {
    const escaped = JSON.stringify(JSON.stringify({ code: 'success', data: { name: 'Nguyễn Văn A' } }))

    expect(decodePayload(escaped)).toEqual({ kind: 'json', value: { code: 'success', data: { name: 'Nguyễn Văn A' } }, invalidJson: false })
  })

  it('decodes unicode escapes', () => {
    expect(decodePayload('{"name":"Ti\\u1ebfng Vi\\u1ec7t"}').value).toEqual({ name: 'Tiếng Việt' })
  })

  it('keeps object payloads by reference', () => {
    const value = { nested: { deep: [1, 2, { x: 'y' }] } }

    expect(decodePayload(value).value).toBe(value)
    expect(decodePayload(value).kind).toBe('json')
  })

  it.each([null, undefined, '', '   \n '])('treats %j as empty', value => {
    expect(decodePayload(value).kind).toBe('empty')
  })

  it('flags malformed JSON without throwing and keeps the original text', () => {
    expect(decodePayload('{"broken": ')).toEqual({ kind: 'text', value: '{"broken": ', invalidJson: true })
  })

  it('keeps plain text verbatim', () => {
    expect(decodePayload('  plain\ntext  ')).toEqual({ kind: 'text', value: '  plain\ntext  ', invalidJson: false })
    expect(decodePayload('123')).toEqual({ kind: 'text', value: '123', invalidJson: false })
  })
})

describe('preparePayloadContent', () => {
  it('builds pretty and raw text from the sanitized value', () => {
    const content = preparePayloadContent('{"password":"p@ss","items":[1]}', {
      sanitize: value => ({ ...(value as object), password: '<masked>' })
    })

    expect(content.pretty).toBe('{\n  "password": "<masked>",\n  "items": [\n    1\n  ]\n}')
    expect(content.raw).toBe('{"password":"<masked>","items":[1]}')
    expect(content.pretty).not.toContain('p@ss')
  })

  it('never renders [object Object] for object payloads', () => {
    const content = preparePayloadContent({ a: { b: 1 } })

    expect(content.pretty).not.toContain('[object Object]')
    expect(content.raw).toBe('{"a":{"b":1}}')
  })

  it('sanitizes plain text payloads with the text sanitizer', () => {
    expect(preparePayloadContent('token=abc', { sanitizeText: () => 'token=<masked>' }).pretty).toBe('token=<masked>')
  })

  it('keeps text-only content (message) unparsed', () => {
    const content = preparePayloadContent('{"a":1}', { textOnly: true })

    expect(content.kind).toBe('text')
    expect(content.pretty).toBe('{"a":1}')
  })

  it('handles large payloads', () => {
    const value = { items: Array.from({ length: 5000 }, (_, index) => ({ index, label: `item-${index}` })) }
    const content = preparePayloadContent(JSON.stringify(value))

    expect(content.kind).toBe('json')
    expect(JSON.parse(content.raw)).toEqual(value)
  })
})

describe('log text highlighting', () => {
  it('marks BEGIN/END/REQUEST/RESPONSE and error words without changing the text', () => {
    const text = '[BEGIN_REQUEST] call\nRESPONSE ok\nSystem.Exception: failed END'
    const tokens = tokenizeLogText(text)

    expect(tokens.map(token => token.text).join('')).toBe(text)
    expect(tokens.filter(token => token.type === 'marker').map(token => token.text)).toEqual(['BEGIN', 'REQUEST', 'RESPONSE', 'END'])
    expect(tokens.filter(token => token.type === 'danger').map(token => token.text)).toEqual(['Exception'])
  })

  it('does not highlight words that merely contain a marker', () => {
    expect(tokenizeLogText('BEGINNING SENDER').every(token => token.type === 'plain')).toBe(true)
  })
})

describe('line splitting', () => {
  it('splits tokens on newlines and preserves empty lines', () => {
    expect(splitTokensIntoLines([{ type: 'plain', text: 'a\n\nb' }, { type: 'marker', text: 'END' }])).toEqual([
      [{ type: 'plain', text: 'a' }],
      [],
      [{ type: 'plain', text: 'b' }, { type: 'marker', text: 'END' }]
    ])
  })

  it('skips highlighting above the size limit', () => {
    const text = 'x'.repeat(PAYLOAD_HIGHLIGHT_CHAR_LIMIT + 1)
    const result = buildPayloadLines(text, 'json')

    expect(result.highlighted).toBe(false)
    expect(result.truncatedHighlight).toBe(true)
    expect(result.lines).toHaveLength(1)
  })
})
