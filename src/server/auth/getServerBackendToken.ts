import 'server-only'

import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { cache } from 'react'
import { env } from '@/env.mjs'

/**
 * Server Component equivalent of getBackendToken() (which takes a Route Handler's Request
 * directly). Resolves the real backend access token strictly server-side, from the encrypted
 * NextAuth session cookie, for the small number of places that make a genuine server-to-backend
 * call during SSR (e.g. prefetching a page's initial data).
 *
 * Do NOT use this value to build a prop for a Client Component — `auth()` (src/auth.ts) is the
 * right call for anything that ends up in JSX, because Next.js serializes Server Component
 * props into the browser-visible RSC payload, and this function intentionally returns the real,
 * secret token.
 */
async function readServerBackendToken(): Promise<string | null> {
  const headersList = await headers()

  const token = await getToken({
    req: { headers: headersList },
    secret: env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })

  return (token?.token as string | null | undefined) ?? null
}

/**
 * Memoized per server request with React cache(): a page and its AuthorizedLayout (and other
 * server components of the same render) decode the encrypted session cookie once instead of each
 * time. cache() is scoped to a single request — nothing is shared across requests, users or
 * navigations, so a refreshed/expired cookie is always read fresh on the next request.
 */
export const getServerBackendToken: () => Promise<string | null> = cache(readServerBackendToken)
