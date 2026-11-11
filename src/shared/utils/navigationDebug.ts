'use client'

// TEMPORARY runtime instrumentation for the "browser Back stays loading" investigation.
// No-op unless enabled. Enable in the browser console, then reload:
//   localStorage.setItem('ips.navDebug', '1'); location.reload()
// Disable: localStorage.removeItem('ips.navDebug')
// Read the trace: __ipsNavTrace.print()  |  copy(__ipsNavTrace.json())
// Production builds ignore the flag unless NEXT_PUBLIC_NAV_DEBUG=1 at build time.
// Never logs cookies, tokens or session data: only path + query (sensitive param values redacted).

type TraceEntry = { t: string; ms: number; event: string; url: string } & Record<string, unknown>

const STORAGE_KEY = 'ips.navDebug'
const MAX_ENTRIES = 1000
const SENSITIVE_PARAM = /token|secret|password|passwd|session|code|otp|key|auth|signature/i

const buildAllowed = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_NAV_DEBUG === '1'
let cachedEnabled: boolean | null = null

export const isNavDebugEnabled = (): boolean => {
  if (!buildAllowed || typeof window === 'undefined') return false
  if (cachedEnabled !== null) return cachedEnabled

  try {
    cachedEnabled = window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    cachedEnabled = false
  }

  return cachedEnabled
}

/** Path + query with sensitive values redacted; never origin credentials or hash secrets. */
export const safeUrl = (href: string | null | undefined): string | null => {
  if (!href) return href ?? null

  try {
    const url = new URL(href, typeof window !== 'undefined' ? window.location.href : 'http://x')

    url.searchParams.forEach((_value, name) => {
      if (SENSITIVE_PARAM.test(name)) url.searchParams.set(name, '[redacted]')
    })

    return `${url.pathname}${url.search}${url.hash ? '#…' : ''}`
  } catch {
    return '[invalid-url]'
  }
}

const entries: TraceEntry[] = []
const mountedLoaders = new Map<string, number>()
let lastCommittedUrl: string | null = null
let started = 0
let providerInstance: number | null = null
let navContext: () => Record<string, unknown> = () => ({})

/** The lifecycle registers a getter so every line carries navId / pending / owner. */
export const registerNavContext = (getter: () => Record<string, unknown>) => {
  navContext = getter
}

/** Which NavigationLifecycleProvider mount currently owns the window listeners. */
export const setNavProviderInstance = (instance: number | null) => {
  providerInstance = instance
}

const sanitize = (data: Record<string, unknown>) => {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    out[key] = typeof value === 'string' && /url|source|href|target|previous/i.test(key) ? safeUrl(value) : value
  }

  return out
}

export const navTrace = (event: string, data: Record<string, unknown> = {}) => {
  if (!isNavDebugEnabled()) return
  if (!started) started = performance.now()

  const url = safeUrl(window.location.href) ?? ''
  const queryStart = url.indexOf('?')

  const entry: TraceEntry = {
    t: new Date().toISOString().slice(11, 23),
    ms: Math.round(performance.now() - started),
    event,
    url,
    pathname: queryStart === -1 ? url.replace(/#….*$/, '') : url.slice(0, queryStart),
    search: queryStart === -1 ? '' : url.slice(queryStart).replace(/#…$/, ''),
    provider: providerInstance,
    ...navContext(),
    lastCommitted: safeUrl(lastCommittedUrl),
    loaders: Array.from(mountedLoaders.keys()).join(',') || '-',
    ...sanitize(data)
  }

  entries.push(entry)
  if (entries.length > MAX_ENTRIES) entries.shift()
  // eslint-disable-next-line no-console
  console.debug(`%c[NAV] ${entry.t} ${event}`, 'color:#7c3aed', entry)
}

/** Called by RouteCompletion whenever Next commits a new pathname/search. */
export const navTraceCommit = (href: string) => {
  lastCommittedUrl = href
}

/** Track which loading UI is on screen right now (mount/unmount). */
export const navTraceLoader = (name: string, mounted: boolean) => {
  if (!isNavDebugEnabled()) return
  const count = (mountedLoaders.get(name) ?? 0) + (mounted ? 1 : -1)

  if (count > 0) mountedLoaders.set(name, count)
  else mountedLoaders.delete(name)
  navTrace(mounted ? 'loader:mount' : 'loader:unmount', { loader: name })
}

if (typeof window !== 'undefined' && isNavDebugEnabled()) {
  const api = {
    entries,
    print: () => {
      // eslint-disable-next-line no-console
      console.table(entries.map(({ t, ms, event, url, navId, pending, owner, provider, loaders, ...rest }) => ({
        t, ms, event, url, navId, pending, owner, provider, loaders, detail: JSON.stringify(rest)
      })))
    },
    json: () => JSON.stringify(entries, null, 2),
    clear: () => { entries.length = 0 },
    loaders: () => Array.from(mountedLoaders.entries())
  }

  ;(window as unknown as { __ipsNavTrace: typeof api }).__ipsNavTrace = api

  // Capture phase on window runs before every bubbling popstate listener (including Next's),
  // so this records the moment the browser fires Back/Forward, before any router work.
  window.addEventListener('popstate', event => {
    navTrace('browser:popstate(capture,first)', {
      hasState: Boolean(event.state),
      nextOwned: Boolean((event.state as { __NA?: boolean } | null)?.__NA)
    })
  }, true)
  window.addEventListener('pageshow', event => navTrace('browser:pageshow', { persisted: event.persisted }))
  window.addEventListener('error', event => navTrace('browser:error', { message: String(event.message).slice(0, 200) }))
  window.addEventListener('unhandledrejection', event => navTrace('browser:unhandledrejection', {
    reason: String((event.reason as { message?: string })?.message ?? event.reason).slice(0, 200)
  }))
  navTrace('debug:enabled')
}
