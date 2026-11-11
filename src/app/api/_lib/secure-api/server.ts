import 'server-only'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import logger from '@lib/logger'
import { SECURE_API_VERSION, SECURE_REQUEST_HEADER, type SecureRequestEnvelope } from '@/lib/secure-api/types'
import { unwrapAesKey, decryptRequestData, encryptResponseData, getServerSecureApiKeyId } from './crypto-server'
import { checkAndRecordRequest } from './replay-protection'
import { SecureApiError } from './errors'

export interface SecureApiContext {
  rid: string
  req: NextRequest
}

type SecureApiHandler<TData, TResult> = (data: TData, context: SecureApiContext) => Promise<TResult>

/**
 * `code` (always prefixed SECURE_API_) lets the client tell a BFF-level rejection — the call never
 * reached the backend — apart from a backend/workflow error. Additive field only.
 */
const jsonError = (message: string, status: number, code: string) =>
  NextResponse.json({ success: false, message, code }, { status })

/**
 * Early rejections used to return without any log line, so a request that died here left no
 * trace in either the BFF or the backend. Only non-sensitive identifiers are logged: route,
 * reason, the client correlation id (x-request-id) and the envelope rid — never body or headers.
 */
const logRejection = (route: string, req: NextRequest, reason: string, rid?: unknown) => {
  const requestId = req.headers.get('x-request-id') ?? '-'

  logger.warn(
    `[secure-api] Rejected ${route}: ${reason} requestId=${requestId} rid=${typeof rid === 'string' ? rid : '-'}`
  )
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Wraps a Route Handler with the secure-api envelope: decrypts the incoming request (see
 * src/lib/secure-api for the client-side counterpart, secureFetch()), enforces the envelope's
 * anti-replay guarantees, calls `handler` with the decrypted payload, then encrypts whatever
 * `handler` returns back into the same envelope shape.
 *
 * Encryption is a transport-confidentiality layer only — it does NOT perform authorization.
 * `handler` is still responsible for resolving and checking the caller's identity itself (e.g.
 * via getBackendToken()/getServerBackendToken()), exactly as every other BFF route does. Do not
 * assume a request reaching `handler` here is from an authorized session — decrypting a request
 * only proves it was built with this server's public key, which is not secret.
 *
 * Route path is only known to the caller (the Next.js file-system route), so `route` must be
 * passed explicitly — it's part of what binds the encryption's AAD, preventing an envelope
 * built for one route from being replayed against another.
 */
export function withSecureApi<TData = unknown, TResult = unknown>(
  route: string,
  handler: SecureApiHandler<TData, TResult>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let envelope: SecureRequestEnvelope

    try {
      const body = await req.json()

      if (!isPlainObject(body) || typeof body.ek !== 'string' || typeof body.iv !== 'string' || typeof body.data !== 'string') {
        logRejection(route, req, 'invalid-envelope')

        return jsonError('Invalid secure request envelope.', 400, 'SECURE_API_INVALID_ENVELOPE')
      }

      envelope = body as unknown as SecureRequestEnvelope
    } catch {
      logRejection(route, req, 'malformed-body')

      return jsonError('Malformed request body.', 400, 'SECURE_API_MALFORMED_BODY')
    }

    if (envelope.v !== SECURE_API_VERSION) {
      logRejection(route, req, `unsupported-version v=${String(envelope.v)}`, envelope.rid)

      return jsonError('Unsupported secure-api version.', 400, 'SECURE_API_UNSUPPORTED_VERSION')
    }

    if (envelope.kid !== getServerSecureApiKeyId()) {
      // Key ids are public identifiers (not key material) — logging both sides pinpoints a
      // NEXT_PUBLIC_SECURE_API_KEY_ID / SECURE_API_KEY_ID mismatch between build and runtime env.
      logRejection(
        route,
        req,
        `unknown-key-id received=${String(envelope.kid)} expected=${getServerSecureApiKeyId()}`,
        envelope.rid
      )

      return jsonError('Unknown key id.', 400, 'SECURE_API_UNKNOWN_KEY_ID')
    }

    const replayCheck = checkAndRecordRequest(envelope.rid, envelope.ts)

    if (!replayCheck.ok) {
      logRejection(route, req, replayCheck.reason ?? 'replay-check-failed', envelope.rid)

      return jsonError(
        replayCheck.reason === 'expired' ? 'Request expired.' : 'Duplicate request rejected.',
        replayCheck.reason === 'expired' ? 408 : 409,
        replayCheck.reason === 'expired' ? 'SECURE_API_REQUEST_EXPIRED' : 'SECURE_API_DUPLICATE_REQUEST'
      )
    }

    let aesKey: Buffer
    let data: TData

    try {
      aesKey = unwrapAesKey(envelope.ek)
      data = decryptRequestData<TData>(aesKey, envelope.iv, envelope.data, {
        v: envelope.v,
        rid: envelope.rid,
        ts: envelope.ts,
        method: req.method,
        route
      })
    } catch (error) {
      logger.error(
        `[secure-api] Decryption failed for ${route} requestId=${req.headers.get('x-request-id') ?? '-'} rid=${envelope.rid}:`,
        error
      )

      return jsonError('Unable to decrypt request.', 400, 'SECURE_API_DECRYPT_FAILED')
    }

    try {
      const result = await handler(data, { rid: envelope.rid, req })

      const { iv, data: encryptedData } = encryptResponseData(aesKey, result, {
        v: envelope.v,
        rid: envelope.rid
      })

      return NextResponse.json(
        { v: SECURE_API_VERSION, rid: envelope.rid, iv, data: encryptedData },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof SecureApiError) {
        if (error.body !== undefined) {
          return NextResponse.json(error.body, { status: error.status })
        }

        return jsonError(error.message, error.status, 'SECURE_API_HANDLER_ERROR')
      }

      logger.error(
        `[secure-api] Handler failed for ${route} requestId=${req.headers.get('x-request-id') ?? '-'} rid=${envelope.rid}:`,
        error
      )

      return jsonError('Internal server error.', 500, 'SECURE_API_HANDLER_FAILED')
    }
  }
}

export { SECURE_REQUEST_HEADER }
