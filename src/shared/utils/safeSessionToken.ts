import type { Session } from 'next-auth'

/**
 * Non-secret placeholder for a `sessiontoken` prop passed from a Server Component into a
 * Client Component. `session.user.token` is ALREADY just this same placeholder — auth()'s
 * session() callback (src/auth.ts) never puts the real backend JWT there in the first place, for
 * server-side callers or the browser. The real token only ever exists server-side, read directly
 * from the encrypted HttpOnly session cookie via getBackendToken()/getServerBackendToken()
 * (src/server/auth/), never through this or any Session-shaped value.
 *
 * Client-side code doesn't need the real value anyway: every BFF route (/api/system-service,
 * /api/bank-service, ...) now resolves the real token itself from the session cookie and
 * ignores whatever sessiontoken/uid the client sends (see getBackendToken()). This placeholder
 * only needs to be truthy while logged in so existing client-side guards keep working.
 */
export const toClientSessionToken = (session: Session | null | undefined): string | undefined =>
  session?.user?.authenticated ? 'ips-session-active' : undefined
