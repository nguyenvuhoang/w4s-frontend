import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const harness = vi.hoisted(() => ({
  pending: false,
  index: 0,
  refs: [] as { current: unknown }[],
  effects: [] as { deps: unknown[]; run: () => void | (() => void); cleanup?: () => void; dirty: boolean }[],
  set: vi.fn(),
  inc: vi.fn(),
  startTransition: (action: () => void) => { harness.pending = true; action() }
}))

vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useRef: (initial: unknown) => {
    const index = harness.index++

    return harness.refs[index] ??= { current: initial }
  },
  useCallback: (callback: unknown) => callback,
  useTransition: () => [harness.pending, harness.startTransition],
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
  useEffect: (run: () => void | (() => void), deps: unknown[]) => {
    const index = harness.index++
    const previous = harness.effects[index]
    const dirty = !previous || deps.some((value, key) => value !== previous.deps[key])

    harness.effects[index] = { deps, run, cleanup: previous?.cleanup, dirty }
  }
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/vi/home', useSearchParams: () => new URLSearchParams() }))
vi.mock('@bprogress/react', () => ({ useProgress: () => ({ set: harness.set, inc: harness.inc }) }))

import { NavigationLifecycleProvider } from './NavigationLifecycleProvider'
import { navigationLifecycle, NAVIGATION_RECOVERY_MS } from './navigationLifecycle'

type Navigate = (href: string, action: () => void, options?: { force?: boolean; showProgress?: boolean }) => void
const documentListeners = new Map<string, (event: unknown) => void>()
const windowListeners = new Map<string, () => void>()
const removeClass = vi.fn()

function render() {
  harness.index = 0
  const tree = NavigationLifecycleProvider({ children: null }) as ReactElement<{ value: Navigate }>

  for (const effect of harness.effects) {
    if (effect?.dirty) {
      effect.cleanup?.()
      effect.cleanup = effect.run() || undefined
      effect.dirty = false
    }
  }

  return tree.props.value
}

class Anchor {
  href = 'https://ips.test/vi/contracts'
  target = ''
  intercepted = false
  download = false
  closest(selector: string) { return selector === 'a[href]' || this.intercepted ? this : null }
  hasAttribute() { return this.download }
}

const click = (anchor: Anchor, overrides = {}) => {
  const event = { target: anchor, button: 0, preventDefault: vi.fn(), ...overrides }

  documentListeners.get('click')!(event)

  return event
}

beforeEach(() => {
  navigationLifecycle.dispose()
  vi.useFakeTimers()
  vi.clearAllMocks()
  harness.pending = false
  harness.refs = []
  harness.effects = []
  documentListeners.clear()
  windowListeners.clear()
  vi.stubGlobal('Element', Anchor)
  vi.stubGlobal('document', {
    documentElement: { classList: { remove: removeClass } },
    addEventListener: (name: string, listener: (event: unknown) => void) => documentListeners.set(name, listener),
    removeEventListener: (name: string) => documentListeners.delete(name)
  })
  vi.stubGlobal('window', {
    location: new URL('https://ips.test/vi/home'),
    addEventListener: (name: string, listener: () => void) => windowListeners.set(name, listener),
    removeEventListener: (name: string) => windowListeners.delete(name)
  })
})

afterEach(() => {
  for (const effect of harness.effects) effect?.cleanup?.()
  navigationLifecycle.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('shared navigation provider', () => {
  it('performs first navigation, deduplicates double click, and skips the active destination', () => {
    const navigate = render()
    const push = vi.fn()

    navigate('/vi/contracts', push)
    navigate('/vi/contracts', push)
    expect(push).toHaveBeenCalledTimes(1)
    window.location.href = 'https://ips.test/vi/contracts'
    navigationLifecycle.completeRoute(window.location.href)
    navigate('/vi/contracts', push)
    expect(push).toHaveBeenCalledTimes(1)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('finishes when React settles without a URL change (cancel/error/redirect)', () => {
    const navigate = render()

    navigate('/vi/contracts', vi.fn())
    render()
    harness.pending = false
    render()
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('cleans up a synchronous router error immediately', () => {
    const navigate = render()

    expect(() => navigate('/vi/contracts', () => { throw new Error('router failed') })).toThrow('router failed')
    expect(navigationLifecycle.getSnapshot()).toBeNull()
    expect(vi.getTimerCount()).toBe(1) // Only the provider's idle bar fade timer.
  })

  it('does not let an older React transition close a newer ordinary link', () => {
    const navigate = render()

    navigate('/vi/contracts', vi.fn())
    render()
    const anchor = new Anchor()

    anchor.href = 'https://ips.test/vi/users/staffs'
    click(anchor)
    harness.pending = false
    render()
    expect(navigationLifecycle.getSnapshot()?.url).toBe(anchor.href)
    navigationLifecycle.completeRoute(anchor.href)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('excludes intercepted parent links, modified clicks, downloads and new tabs', () => {
    render()
    const anchor = new Anchor()

    anchor.intercepted = true
    click(anchor)
    anchor.intercepted = false
    click(anchor, { ctrlKey: true })
    click(anchor, { button: 1 })
    anchor.download = true
    click(anchor)
    anchor.download = false
    anchor.target = '_blank'
    click(anchor)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('deduplicates ordinary links and still loads a different query', () => {
    render()
    const anchor = new Anchor()

    expect(click(anchor).preventDefault).not.toHaveBeenCalled()
    expect(click(anchor).preventDefault).toHaveBeenCalledOnce()
    window.location.href = anchor.href
    navigationLifecycle.completeRoute(anchor.href)
    expect(click(anchor).preventDefault).toHaveBeenCalledOnce()
    anchor.href += '?page=2'
    expect(click(anchor).preventDefault).not.toHaveBeenCalled()
    expect(navigationLifecycle.getSnapshot()?.url).toBe(anchor.href)
  })

  it('leaves ordinary hash-only links to Next/browser without waiting for hashchange', () => {
    render()
    const anchor = new Anchor()

    anchor.href = `${window.location.href}#details`
    expect(click(anchor).preventDefault).not.toHaveBeenCalled()
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('cancels delayed starts/fades on replacement and clears the bar after recovery', () => {
    const navigate = render()

    navigate('/vi/contracts', vi.fn())
    render()
    vi.advanceTimersByTime(50)
    navigate('/vi/users/staffs', vi.fn())
    render()
    vi.advanceTimersByTime(99)
    expect(harness.set).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(harness.set).toHaveBeenLastCalledWith(0.08)
    vi.advanceTimersByTime(NAVIGATION_RECOVERY_MS)
    render()
    vi.advanceTimersByTime(200)
    expect(harness.set).toHaveBeenLastCalledWith(1)
    expect(removeClass).toHaveBeenCalledWith('bprogress-busy')
  })

  it('handles hash signals and removes listeners/loading/timers on unmount', () => {
    render()
    click(new Anchor())
    window.location.href = 'https://ips.test/vi/contracts#details'
    windowListeners.get('hashchange')!()
    expect(navigationLifecycle.getSnapshot()).toBeNull()
    click(new Anchor())
    for (const effect of harness.effects) effect?.cleanup?.()
    expect(documentListeners.size).toBe(0)
    expect(windowListeners.size).toBe(0)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps shallow URL synchronization silent and allows explicit refresh', () => {
    const navigate = render()
    const refresh = vi.fn()

    navigate('?page=2', vi.fn(), { showProgress: false })
    expect(navigationLifecycle.getSnapshot()?.showProgress).toBe(false)
    navigate(window.location.href, refresh, { force: true })
    expect(refresh).toHaveBeenCalledOnce()
    expect(navigationLifecycle.getSnapshot()?.showProgress).toBe(true)
  })
})

// Regression: Browser Back/Forward left a pending navigation (and the full-screen
// NavigationOverlay, shown while `pending.showProgress`) that only the 30s recovery cleared.
// Runtime trace showed Next committing the restored route before our popstate listener ran.
describe('browser history traversal (Back/Forward)', () => {
  // Mirrors the real order observed at runtime: App Router commits, then popstate reaches us.
  const traverse = (href: string, routerCommitsFirst = true) => {
    window.location.href = href
    if (routerCommitsFirst) navigationLifecycle.completeRoute(window.location.href)
    windowListeners.get('popstate')!()
    if (!routerCommitsFirst) navigationLifecycle.completeRoute(window.location.href)
  }
  const overlayWouldShow = () => Boolean(navigationLifecycle.getSnapshot()?.showProgress)
  const visit = (href: string) => {
    const anchor = new Anchor()

    anchor.href = href
    click(anchor)
    window.location.href = href
    navigationLifecycle.completeRoute(href)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  }

  beforeEach(() => navigationLifecycle.completeRoute(window.location.href))

  it.each([true, false])('Dashboard -> page -> Back leaves nothing pending (router commits first: %s)', first => {
    render()
    visit('https://ips.test/vi/properties/floors')
    traverse('https://ips.test/vi/home', first)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
    vi.advanceTimersByTime(1000) // Past NavigationOverlay's 800ms escalation delay.
    expect(overlayWouldShow()).toBe(false)
  })

  it('List -> Detail -> Back -> Forward -> Back with search params', () => {
    render()
    visit('https://ips.test/vi/assets?page=2&status=A')
    visit('https://ips.test/vi/assets/15')
    traverse('https://ips.test/vi/assets?page=2&status=A')
    expect(navigationLifecycle.getSnapshot()).toBeNull()
    traverse('https://ips.test/vi/assets/15')
    expect(navigationLifecycle.getSnapshot()).toBeNull()
    traverse('https://ips.test/vi/assets?status=A&page=2')
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('Back 5 times in a row never accumulates pending state or recovery timers', () => {
    render()
    const pages = ['/vi/a', '/vi/b', '/vi/c', '/vi/d', '/vi/e'].map(path => `https://ips.test${path}`)

    pages.forEach(visit)
    for (const href of [...pages].reverse().slice(1).concat('https://ips.test/vi/home')) {
      traverse(href)
      expect(navigationLifecycle.getSnapshot()).toBeNull()
    }
    vi.advanceTimersByTime(200) // Provider's idle progress-bar fade timer from the initial render.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('Back during an in-flight link click cancels that navigation instead of leaving it stuck', () => {
    render()
    const anchor = new Anchor()

    click(anchor)
    expect(overlayWouldShow()).toBe(true)
    traverse('https://ips.test/vi/home') // Same route as before the click: no new pathname commit.
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('UI navigation keeps working after Back (owned router push)', () => {
    const navigate = render()
    const push = vi.fn()

    visit('https://ips.test/vi/contracts')
    traverse('https://ips.test/vi/home')
    navigate('/vi/contracts', push)
    expect(push).toHaveBeenCalledOnce()
    expect(navigationLifecycle.getSnapshot()?.owned).toBe(true)
    window.location.href = 'https://ips.test/vi/contracts'
    navigationLifecycle.completeRoute(window.location.href)
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })

  it('a provider remount (login -> dashboard) does not change traversal behaviour', () => {
    render()
    for (const effect of harness.effects) effect?.cleanup?.()
    harness.effects = []
    harness.refs = []
    render()
    visit('https://ips.test/vi/dashboards')
    visit('https://ips.test/vi/properties/floors')
    traverse('https://ips.test/vi/dashboards')
    expect(navigationLifecycle.getSnapshot()).toBeNull()
  })
})
