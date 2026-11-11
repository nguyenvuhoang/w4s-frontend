import 'server-only'

import { constants, privateDecrypt, createDecipheriv, createCipheriv, randomBytes } from 'node:crypto'
import { env } from '@/env.mjs'

const AAD_ENCODING: BufferEncoding = 'utf8'
const AES_KEY_LENGTH = 32 // 256-bit
const GCM_IV_LENGTH = 12
const GCM_TAG_LENGTH = 16

let cachedPrivateKeyPem: string | null | undefined

const getPrivateKeyPem = (): string => {
  if (cachedPrivateKeyPem === undefined) {
    const base64Pem = env.SECURE_API_RSA_PRIVATE_KEY_BASE64

    cachedPrivateKeyPem = base64Pem ? Buffer.from(base64Pem, 'base64').toString('utf8') : null
  }

  if (!cachedPrivateKeyPem) {
    throw new Error('SECURE_API_RSA_PRIVATE_KEY_BASE64 is not configured.')
  }

  return cachedPrivateKeyPem
}

export const getServerSecureApiKeyId = (): string => env.SECURE_API_KEY_ID || 'k1'

/** Decrypts the RSA-OAEP(SHA-256)-wrapped AES key from a request envelope's `ek` field. */
export function unwrapAesKey(ekBase64: string): Buffer {
  const wrapped = Buffer.from(ekBase64, 'base64')

  const raw = privateDecrypt(
    {
      key: getPrivateKeyPem(),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    wrapped
  )

  if (raw.length !== AES_KEY_LENGTH) {
    throw new Error('Unwrapped AES key has unexpected length.')
  }

  return raw
}

const buildRequestAad = (v: number, rid: string, ts: number, method: string, route: string): Buffer =>
  Buffer.from(`${v}:${rid}:${ts}:${method}:${route}`, AAD_ENCODING)

const buildResponseAad = (v: number, rid: string): Buffer =>
  Buffer.from(`${v}:${rid}:response`, AAD_ENCODING)

/**
 * Decrypts a request envelope's `data` field. `ciphertextB64` is expected to be
 * base64(ciphertext || 16-byte GCM auth tag) — the same combined format Web Crypto's
 * subtle.encrypt() produces client-side (see crypto-client.ts).
 */
export function decryptRequestData<T>(
  aesKey: Buffer,
  ivB64: string,
  ciphertextB64: string,
  meta: { v: number; rid: string; ts: number; method: string; route: string }
): T {
  const iv = Buffer.from(ivB64, 'base64')
  const combined = Buffer.from(ciphertextB64, 'base64')
  const tag = combined.subarray(combined.length - GCM_TAG_LENGTH)
  const ciphertext = combined.subarray(0, combined.length - GCM_TAG_LENGTH)

  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv)

  decipher.setAAD(buildRequestAad(meta.v, meta.rid, meta.ts, meta.method, meta.route))
  decipher.setAuthTag(tag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return JSON.parse(plaintext.toString('utf8')) as T
}

/**
 * Encrypts a response payload with the SAME AES key used to decrypt the request, but a fresh
 * random IV (never reuse an IV with the same key — see withSecureApi()).
 */
export function encryptResponseData(
  aesKey: Buffer,
  payload: unknown,
  meta: { v: number; rid: string }
): { iv: string; data: string } {
  const iv = randomBytes(GCM_IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv)

  cipher.setAAD(buildResponseAad(meta.v, meta.rid))

  const plaintext = Buffer.from(JSON.stringify(payload ?? {}), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('base64'),
    data: Buffer.concat([ciphertext, tag]).toString('base64')
  }
}
