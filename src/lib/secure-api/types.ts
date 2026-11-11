/**
 * End-to-end request/response envelope shared between the client (secureFetch) and server
 * (withSecureApi). See src/lib/secure-api/client.ts and src/app/api/_lib/secure-api/server.ts.
 *
 * Every field here is either non-secret (v, kid, rid, ts) or ciphertext (ek, iv, data). Nothing
 * in this shape reveals the business payload, the workflow id, or any field name to anyone
 * inspecting the browser's Network tab.
 */
export interface SecureRequestEnvelope {
  /** Envelope format version. */
  v: 1
  /** Which RSA keypair encrypted `ek` — supports future key rotation. */
  kid: string
  /** Random per-request id (crypto.randomUUID()), used for anti-replay. */
  rid: string
  /** Unix ms timestamp when the envelope was created, used for anti-replay. */
  ts: number
  /** Base64 RSA-OAEP(SHA-256)-encrypted raw AES-256 key. */
  ek: string
  /** Base64 AES-GCM IV (12 bytes) used for `data`. */
  iv: string
  /** Base64 AES-256-GCM ciphertext (with the 16-byte auth tag appended) of the JSON payload. */
  data: string
}

export interface SecureResponseEnvelope {
  v: 1
  /** Echoes the request's `rid`, so the client can correlate response to request. */
  rid: string
  /** Base64 AES-GCM IV (12 bytes) for the response — always different from the request's IV. */
  iv: string
  /** Base64 AES-256-GCM ciphertext (with the 16-byte auth tag appended) of the JSON response. */
  data: string
}

export const SECURE_API_VERSION = 1 as const

export const SECURE_REQUEST_HEADER = 'x-secure-api' as const
