import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { captured, push, replace } = vi.hoisted(() => ({
  captured: { props: {} as Record<string, any> }, push: vi.fn(), replace: vi.fn()
}))

vi.mock('next/link', () => ({ default: (props: Record<string, any>) => { captured.props = props; return null } }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push, replace }) }))

import { RouterLink } from './RouterLink'

beforeEach(() => vi.clearAllMocks())

describe('menu RouterLink navigation', () => {
  it('routes accepted Next Link navigation through the shared lifecycle, without capture loading', () => {
    renderToStaticMarkup(createElement(RouterLink, { href: '/vi/contracts', children: 'Contracts' }))
    const event = { preventDefault: vi.fn() }

    expect(captured.props['data-prevent-progress']).toBe('true')
    captured.props.onNavigate(event)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith('/vi/contracts', { scroll: undefined })
    expect(replace).not.toHaveBeenCalled()
  })

  it('preserves replace, query, hash and scroll options', () => {
    renderToStaticMarkup(createElement(RouterLink, {
      href: { pathname: '/en/contracts', query: { page: 2 }, hash: 'details' }, replace: true, scroll: false
    }))
    captured.props.onNavigate({ preventDefault: vi.fn() })
    expect(replace).toHaveBeenCalledWith('/en/contracts?page=2#details', { scroll: false })
  })

  it('respects a caller that cancels navigation', () => {
    renderToStaticMarkup(createElement(RouterLink, {
      href: '/vi/contracts', onNavigate: event => event.preventDefault()
    }))
    captured.props.onNavigate({ preventDefault: vi.fn() })
    expect(push).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })

  it('preserves click handlers, native targets and prefetch', () => {
    const onClick = vi.fn()

    renderToStaticMarkup(createElement(RouterLink, {
      href: '/vi/contracts', onClick, target: '_blank', prefetch: false
    }))
    expect(captured.props.onClick).toBe(onClick)
    expect(captured.props.target).toBe('_blank')
    expect(captured.props.prefetch).toBe(false)
  })
})
