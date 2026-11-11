import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const harness = vi.hoisted(() => ({
  active: '',
  cursor: 0,
  states: new Map<string, unknown[]>(),
  controls: [] as Array<{ name: string; props: Record<string, any> }>,
  notify: vi.fn()
}))

// The project uses a Node test environment. Retain state across explicit SSR renders
// to exercise the real viewer event handlers without adding a DOM dependency.
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()

  return {
    ...actual,
    useState: (initial: unknown) => {
      const id = harness.active
      const index = harness.cursor++
      const state = harness.states.get(id) ?? []

      if (!(index in state)) state[index] = initial
      harness.states.set(id, state)

      return [state[index], (value: unknown) => { state[index] = value }]
    }
  }
})

vi.mock('@mui/material', async () => {
  const { createElement: h } = await import('react')
  const component = (name: string) => (props: Record<string, any>) => {
    harness.controls.push({ name, props })

    return h(props.component ?? 'div', null, props.children)
  }

  return Object.fromEntries(['Box', 'Stack', 'Tooltip', 'IconButton', 'ToggleButton', 'ToggleButtonGroup', 'NoSsr'].map(name => [name, component(name)]))
})

vi.mock('@mui/icons-material/ContentCopy', () => ({ default: () => null }))
vi.mock('@/shared/utils/SwalAlert', () => ({ default: harness.notify }))
vi.mock('@/@core/components/jSONEditor', () => ({ default: (props: Record<string, any>) => {
  harness.controls.push({ name: 'Tree', props })

  return null
} }))

import ReadOnlyJsonViewer from './ReadOnlyJsonViewer'

const labels = { tree: 'Tree', json: 'JSON', viewMode: 'View mode', copy: 'Copy JSON', copySuccess: 'Copied', copyFailed: 'Copy failed' }
const data = { items: [{ total: 1234.5 }], active: false }
const render = (id = 'input', value: unknown = data, sanitize?: (value: unknown) => unknown) => {
  harness.active = id
  harness.cursor = 0
  harness.controls = []

  return renderToStaticMarkup(createElement(ReadOnlyJsonViewer, { value, labels, sanitize }))
}
const control = (name: string) => harness.controls.find(item => item.name === name)!.props

beforeEach(() => {
  harness.states.clear()
  harness.notify.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe('ReadOnlyJsonViewer', () => {
  it('switches each viewer independently and preserves the read-only tree', () => {
    render('input')
    expect(control('ToggleButtonGroup').value).toBe('tree')
    expect(control('Tree').readOnly).toBe(true)
    control('ToggleButtonGroup').onChange(null, 'json')

    expect(render('input')).toContain('<pre>')
    expect(control('ToggleButtonGroup').value).toBe('json')
    render('response')
    expect(control('ToggleButtonGroup').value).toBe('tree')
    render('input')
    control('ToggleButtonGroup').onChange(null, 'tree')
    render('input')
    expect(control('ToggleButtonGroup').value).toBe('tree')
    control('ToggleButtonGroup').onChange(null, null)
    render('input')
    expect(control('ToggleButtonGroup').value).toBe('tree')
  })

  it('copies the complete formatted data in both modes and notifies after success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render()
    await control('IconButton').onClick()
    expect(writeText).toHaveBeenLastCalledWith('{\n  "items": [\n    {\n      "total": 1234.5\n    }\n  ],\n  "active": false\n}')
    expect(harness.notify).toHaveBeenCalledWith('success', 'Copied', 'top-end')
    control('ToggleButtonGroup').onChange(null, 'json')
    render()
    await control('IconButton').onClick()
    expect(writeText).toHaveBeenCalledTimes(2)
    expect(writeText.mock.calls[0][0]).toBe(writeText.mock.calls[1][0])
  })

  it('preserves and copies invalid JSON as plain text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render('invalid', '{"broken":')
    control('ToggleButtonGroup').onChange(null, 'json')
    const html = render('invalid', '{"broken":')

    expect(html).toContain('{&quot;broken&quot;:')
    await control('IconButton').onClick()
    expect(writeText).toHaveBeenCalledWith('{"broken":')
  })

  it('uses the sanitizer for the tree, JSON view and clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const source = { token: 'private-token', total: 12.5 }
    const sanitize = (value: unknown) => ({ ...(value as object), token: '<masked>' })
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render('secure', source, sanitize)

    expect(control('Tree').initialJson).toEqual({ token: '<masked>', total: 12.5 })
    control('ToggleButtonGroup').onChange(null, 'json')
    expect(render('secure', source, sanitize)).not.toContain('private-token')
    await control('IconButton').onClick()
    expect(writeText).toHaveBeenCalledWith('{\n  "token": "<masked>",\n  "total": 12.5\n}')
    expect(source.token).toBe('private-token')
  })

  it.each([undefined, { writeText: vi.fn().mockRejectedValue(new Error('denied')) }])('reports clipboard failures without success feedback', async clipboard => {
    vi.stubGlobal('navigator', { clipboard })
    render()
    await control('IconButton').onClick()

    expect(harness.notify).toHaveBeenCalledWith('error', 'Copy failed', 'top-end')
    expect(harness.notify).not.toHaveBeenCalledWith('success', expect.anything(), expect.anything())
  })
})
