/**
 * Browser-side crypto primitives for secureFetch(), using the native Web Crypto API only —
 * no symmetric key ever lives in client code or an environment variable shipped to the
 * browser. Only the RSA PUBLIC key (safe by design: it can encrypt but not decrypt) is
 * available here, via NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64.
 */
'use client'

const b64ToBytes = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0))

const bytesToB64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''

  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i])

  return btoa(binary)
}

const pemFromBase64 = (base64Pem: string): ArrayBuffer => {
  const pem = atob(base64Pem)
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')

  return b64ToBytes(body).buffer as ArrayBuffer
}

let cachedPublicKey: Promise<CryptoKey> | null = null

const importPublicKey = (): Promise<CryptoKey> => {
  if (cachedPublicKey) return cachedPublicKey

  const base64Pem = process.env.NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64

  if (!base64Pem) {
    throw new Error('NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64 is not configured.')
  }

  cachedPublicKey = crypto.subtle.importKey(
    'spki',
    pemFromBase64(base64Pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )

  return cachedPublicKey
}

export const getSecureApiKeyId = (): string =>
  process.env.NEXT_PUBLIC_SECURE_API_KEY_ID || 'k1'

export type SecureApiClientIssue = 'PUBLIC_KEY_MISSING' | 'WEBCRYPTO_UNAVAILABLE'

/**
 * Pre-flight check for what secureFetch() needs before it can even build a request envelope.
 * Lets callers tell "the request was never sent" (build/env/browser problem) apart from a real
 * BFF/backend failure. Returns null when the client can encrypt. Never exposes the key itself.
 */
export const getSecureApiClientIssue = (): SecureApiClientIssue | null => {
  if (!process.env.NEXT_PUBLIC_SECURE_API_RSA_PUBLIC_KEY_BASE64) return 'PUBLIC_KEY_MISSING'

  const webCrypto = (globalThis as { crypto?: Crypto }).crypto

  if (!webCrypto?.subtle || typeof webCrypto.randomUUID !== 'function') return 'WEBCRYPTO_UNAVAILABLE'

  return null
}

const buildAad = (v: number, rid: string, ts: number, method: string, route: string): Uint8Array =>
  new TextEncoder().encode(`${v}:${rid}:${ts}:${method}:${route}`)

export interface EncryptedRequestParts {
  ek: string
  iv: string
  data: string
  aesKey: CryptoKey
}

/**
 * Encrypts `payload` for a request: generates a fresh AES-256-GCM key, encrypts the JSON body
 * with it (bound to the request's v/rid/ts/method/route via AAD so the envelope can't be
 * replayed against a different route or re-signed with different metadata), then wraps the AES
 * key with the server's RSA public key. Returns the AES key too, so the caller can reuse it to
 * decrypt the response — the response is encrypted with the SAME key, a different IV.
 */
export async function encryptRequest(
  payload: unknown,
  meta: { v: number; rid: string; ts: number; method: string; route: string }
): Promise<EncryptedRequestParts> {
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const aad = buildAad(meta.v, meta.rid, meta.ts, meta.method, meta.route)
  const plaintext = new TextEncoder().encode(JSON.stringify(payload ?? {}))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData: aad as BufferSource },
    aesKey,
    plaintext
  )

  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey)
  const publicKey = await importPublicKey()
  const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey)

  return {
    ek: bytesToB64(wrappedKey),
    iv: bytesToB64(iv),
    data: bytesToB64(ciphertext),
    aesKey
  }
}

/**
 * Decrypts a response envelope using the AES key generated for the matching request.
 */
export async function decryptResponse<T>(
  aesKey: CryptoKey,
  ivB64: string,
  dataB64: string,
  meta: { v: number; rid: string }
): Promise<T> {
  const iv = b64ToBytes(ivB64)
  const ciphertext = b64ToBytes(dataB64)
  // Response AAD only binds v/rid (method/route/ts don't apply to a response) — must match
  // exactly what the server used when encrypting, see crypto-server.ts encryptResponse().
  const aad = new TextEncoder().encode(`${meta.v}:${meta.rid}:response`)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData: aad as BufferSource },
    aesKey,
    ciphertext as BufferSource
  )

  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}
