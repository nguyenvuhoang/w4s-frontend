import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { captured } = vi.hoisted(() => ({ captured: [] as Array<{ name: string; props: Record<string, any> }> }))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const make = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return { Tab: make('Tab'), Tabs: make('Tabs') }
})

let DetailTabs: typeof import('./DetailTabs').default

beforeAll(async () => {
  ({ default: DetailTabs } = await import('./DetailTabs'))
})

beforeEach(() => {
  captured.length = 0
})

describe('DetailTabs', () => {
  const tabs = [
    { value: 'info' as const, label: 'Thông tin' },
    { value: 'history' as const, label: 'Lịch sử thay đổi' }
  ]

  it('renders the tabs with the selected value, primary colors and a scrollable bar for small screens', () => {
    const html = renderToStaticMarkup(createElement(DetailTabs<'info' | 'history'>, { tabs, value: 'info', onChange: vi.fn(), ariaLabel: 'tabs' }))
    const bar = captured.find(item => item.name === 'Tabs')!.props

    expect(html).toContain('Thông tin')
    expect(html).toContain('Lịch sử thay đổi')
    expect(bar.value).toBe('info')
    expect(bar.textColor).toBe('primary')
    expect(bar.indicatorColor).toBe('primary')
    expect(bar.variant).toBe('scrollable')
    expect(captured.filter(item => item.name === 'Tab').map(item => item.props['aria-controls'])).toEqual(['detail-tabpanel-info', 'detail-tabpanel-history'])
  })

  it('reports the clicked tab value', () => {
    const onChange = vi.fn()

    renderToStaticMarkup(createElement(DetailTabs<'info' | 'history'>, { tabs, value: 'info', onChange, ariaLabel: 'tabs' }))
    captured.find(item => item.name === 'Tabs')!.props.onChange({}, 'history')

    expect(onChange).toHaveBeenCalledWith('history')
  })
})
