import { describe, expect, it } from 'vitest'

import { prepareJsonViewerContent, tokenizeJson } from './jsonViewerContent'

describe('JSON viewer content', () => {
  it('formats the full object with two spaces without truncating collapsed descendants', () => {
    const value = { items: [{ description: 'a long business description '.repeat(80), total: 1.25 }], enabled: true }
    const content = prepareJsonViewerContent(value)

    expect(content.text).toBe(JSON.stringify(value, null, 2))
    expect(content.treeValue).toEqual(value)
    expect(content.text).toContain('  "items": [\n    {')
  })

  it.each([
    [' {"items":[1,false,null]} ', '{\n  "items": [\n    1,\n    false,\n    null\n  ]\n}'],
    ['[1,2]', '[\n  1,\n  2\n]'],
    ['false', 'false'],
    ['null', 'null'],
    ['"hello"', '"hello"']
  ])('parses valid JSON strings: %s', (value, text) => {
    expect(prepareJsonViewerContent(value).text).toBe(text)
  })

  it.each(['  plain text\nwith spaces  ', '{"broken":', '', '<script>alert("x")</script>'])('preserves non-JSON text: %s', value => {
    const content = prepareJsonViewerContent(value)

    expect(content.text).toBe(value)
    expect(content.isJson).toBe(false)
  })

  it('sanitizes parsed data before producing either representation without changing its source', () => {
    const source = { password: 'secret', items: [1, 2] }
    const content = prepareJsonViewerContent(JSON.stringify(source), value => ({ ...(value as object), password: '<masked>' }))

    expect(content.text).toBe('{\n  "password": "<masked>",\n  "items": [\n    1,\n    2\n  ]\n}')
    expect(content.treeValue).toEqual({ password: '<masked>', items: [1, 2] })
    expect(source.password).toBe('secret')
  })

  it('highlights keys, escaped strings, numbers, booleans and null without changing the text', () => {
    const text = String.raw`{"key": "escaped \" value", "count": -1.2e+3, "ok": false, "empty": null}`
    const tokens = tokenizeJson(text)

    expect(tokens.map(token => token.text).join('')).toBe(text)
    expect(tokens.filter(token => token.type !== 'plain').map(token => token.type)).toEqual([
      'key', 'string', 'key', 'number', 'key', 'boolean', 'key', 'null'
    ])
  })
})
