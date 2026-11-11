import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { native, navigate } = vi.hoisted(() => ({
  native: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() },
  navigate: vi.fn((_href: string, action: () => void, _options?: unknown) => action())
}))

vi.mock('next/navigation', () => ({ useRouter: () => native }))
vi.mock('@/shared/components/progressbar/NavigationLifecycleProvider', () => ({ useNavigationTransition: () => navigate }))

import { useRouter } from './useRouter'

let router: ReturnType<typeof useRouter>

afterEach(() => vi.unstubAllGlobals())

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('window', { location: { href: 'https://ips.test/vi/home' } })
  renderToStaticMarkup(createElement(() => { router = useRouter(); return null }))
})

describe('shared router entry points', () => {
  it.each(['push', 'replace'] as const)('%s uses the shared lifecycle', method => {
    router[method]('/vi/contracts?page=2#details')
    expect(navigate).toHaveBeenCalledWith('/vi/contracts?page=2#details', expect.any(Function), { showProgress: true })
    expect(native[method]).toHaveBeenCalledWith('/vi/contracts?page=2#details', {})
  })

  it('preserves silent scroll:false sync and explicit progress override', () => {
    router.replace('/vi/home?page=2', { scroll: false })
    expect(navigate.mock.calls[0][2]).toEqual({ showProgress: false })
    router.push('/vi/contracts', { scroll: false, showProgress: true })
    expect(navigate.mock.calls[1][2]).toEqual({ showProgress: true })
  })

  it('refresh is explicit even on the current URL', () => {
    router.refresh()
    expect(navigate).toHaveBeenCalledWith('https://ips.test/vi/home', expect.any(Function), { force: true })
    expect(native.refresh).toHaveBeenCalledOnce()
  })

  it('does not start speculative loading for back/forward/prefetch', () => {
    router.back()
    router.forward()
    router.prefetch('/vi/contracts')
    expect(native.back).toHaveBeenCalledOnce()
    expect(native.forward).toHaveBeenCalledOnce()
    expect(native.prefetch).toHaveBeenCalledWith('/vi/contracts')
    expect(navigate).not.toHaveBeenCalled()
  })
})
