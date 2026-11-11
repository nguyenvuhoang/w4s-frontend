'use client'

import { SECURE_API_VERSION, SECURE_REQUEST_HEADER, type SecureRequestEnvelope, type SecureResponseEnvelope } from './types'
import { encryptRequest, decryptResponse, getSecureApiKeyId } from './crypto-client'

export interface SecureFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
}

export interface SecureFetchResult<T> {
  status: number
  ok: boolean
  data: T | null
  /** Raw error body when the server responded with a non-2xx, unencrypted error envelope. */
  error?: unknown
}

/**
 * Client-side call for routes wrapped in withSecureApi() server-side. Encrypts `data` into a
 * request envelope (fresh AES-256-GCM key per call, wrapped with the server's RSA public key),
 * POSTs it to `url`, then decrypts the response envelope with the same AES key. The browser's
 * Network tab only ever sees the opaque { v, kid, rid, ts, ek, iv, data } envelope — never the
 * workflow id, field names, or business payload in plaintext.
 *
 * Authorization is unaffected by this layer: the server still resolves the caller's identity
 * from the session cookie (getBackendToken/getServerBackendToken), exactly as every other BFF
 * route already does. Encryption here is a transport confidentiality property, not an auth
 * mechanism.
 */
export async function secureFetch<TResponse = unknown, TBody = unknown>(
  url: string,
  data: TBody,
  options: SecureFetchOptions = {}
): Promise<SecureFetchResult<TResponse>> {
  const method = options.method ?? 'POST'
  const rid = crypto.randomUUID()
  const ts = Date.now()

  const { ek, iv, data: encryptedData, aesKey } = await encryptRequest(data, {
    v: SECURE_API_VERSION,
    rid,
    ts,
    method,
    route: url
  })

  const envelope: SecureRequestEnvelope = {
    v: SECURE_API_VERSION,
    kid: getSecureApiKeyId(),
    rid,
    ts,
    ek,
    iv,
    data: encryptedData
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      [SECURE_REQUEST_HEADER]: 'true',
      ...options.headers
    },
    body: JSON.stringify(envelope)
  })

  const contentType = response.headers.get('content-type') ?? ''
  const rawBody = contentType.includes('application/json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    return { status: response.status, ok: false, data: null, error: rawBody }
  }

  const responseEnvelope = rawBody as SecureResponseEnvelope | null

  if (!responseEnvelope || typeof responseEnvelope.data !== 'string' || typeof responseEnvelope.iv !== 'string') {
    return { status: response.status, ok: false, data: null, error: 'Invalid secure response envelope.' }
  }

  const decrypted = await decryptResponse<TResponse>(aesKey, responseEnvelope.iv, responseEnvelope.data, {
    v: SECURE_API_VERSION,
    rid
  })

  return { status: response.status, ok: true, data: decrypted }
}
