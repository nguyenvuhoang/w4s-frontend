import 'server-only'

import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { env } from '@/env.mjs'

export interface BackendCredential {
  accessToken: string
  refreshToken: string | null
}

/**
 * Resolves the current user's real backend access/refresh token strictly server-side, by
 * decoding the encrypted NextAuth session cookie directly (bypassing the session() callback,
 * which intentionally strips the token before it can reach the browser — see src/auth.ts).
 *
 * Route handlers must call this instead of trusting any uid/authorization header sent by the
 * client: those headers are untrusted browser input and must be ignored when building the
 * request to the real backend.
 */
export async function getBackendToken(req: Request | NextRequest): Promise<BackendCredential | null> {
  const token = await getToken({
    req: req as NextRequest,
    secret: env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })

  const accessToken = token?.token as string | null | undefined

  if (!accessToken) return null

  return {
    accessToken,
    refreshToken: (token?.refresh_token as string | null | undefined) ?? null
  }
}
