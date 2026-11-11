import 'server-only'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

import {
  buildVietQrQuickLink,
  mapVietQrBanks,
  VIETQR_BANKS_URL,
  VIETQR_TEMPLATE,
  type VietQrBank,
  type VietQrInput
} from './vietqr'

/** Server-only VietQR access. Credentials (VIETQR_CLIENT_ID / VIETQR_API_KEY) never leave the server. */

const VIETQR_GENERATE_URL = 'https://api.vietqr.io/v2/generate'
const VIETQR_TIMEOUT_MS = 10_000
const BANKS_REVALIDATE_SECONDS = 24 * 60 * 60
const MAX_QR_IMAGE_BYTES = 2 * 1024 * 1024

export class VietQrServiceError extends Error {
  constructor(message: string, readonly reason: 'timeout' | 'upstream' | 'storage' | 'invalid') {
    super(message)
    this.name = 'VietQrServiceError'
  }
}

const timeoutSignal = (ms: number) => AbortSignal.timeout(ms)

const isAbort = (error: unknown) => error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')

/** GET /v2/banks (public, cached 1 day). Never throws: an error / timeout returns { banks: [], error }. */
export async function fetchVietQrBanks(): Promise<{ banks: VietQrBank[]; error: 'timeout' | 'upstream' | null }> {
  try {
    const response = await fetch(VIETQR_BANKS_URL, {
      signal: timeoutSignal(VIETQR_TIMEOUT_MS),
      next: { revalidate: BANKS_REVALIDATE_SECONDS }
    } as RequestInit)

    if (!response.ok) return { banks: [], error: 'upstream' }

    const banks = mapVietQrBanks(await response.json())

    return { banks, error: banks.length > 0 ? null : 'upstream' }
  } catch (error) {
    return { banks: [], error: isAbort(error) ? 'timeout' : 'upstream' }
  }
}

/** Generate API credentials from the server environment, or null when not configured. */
export const getVietQrCredentials = () => {
  const clientId = process.env.VIETQR_CLIENT_ID?.trim()
  const apiKey = process.env.VIETQR_API_KEY?.trim()

  return clientId && apiKey ? { clientId, apiKey } : null
}

const decodeDataUrl = (dataUrl: unknown) => {
  const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/) : null

  if (!match) throw new VietQrServiceError('VietQR returned an invalid QR image.', 'upstream')

  return Buffer.from(match[1], 'base64')
}

/**
 * PNG of the QR: POST /v2/generate (credentials in headers, server-side) when configured, otherwise the public
 * Quick Link image. No amount (project account QR).
 */
export async function createVietQrImage(input: VietQrInput): Promise<{ image: Buffer; source: 'generate' | 'quick_link' }> {
  const credentials = getVietQrCredentials()

  try {
    if (credentials) {
      const response = await fetch(VIETQR_GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': credentials.clientId, 'x-api-key': credentials.apiKey },
        body: JSON.stringify({
          accountNo: input.accountNo,
          accountName: input.accountName,
          acqId: input.bin,
          ...(input.addInfo ? { addInfo: input.addInfo } : {}),
          template: VIETQR_TEMPLATE
        }),
        signal: timeoutSignal(VIETQR_TIMEOUT_MS),
        cache: 'no-store'
      })
      const json = await response.json().catch(() => null)

      if (!response.ok || json?.code !== '00') {
        throw new VietQrServiceError(typeof json?.desc === 'string' ? json.desc : `VietQR generate failed (${response.status}).`, 'upstream')
      }

      return { image: decodeDataUrl(json?.data?.qrDataURL), source: 'generate' }
    }

    const response = await fetch(buildVietQrQuickLink(input), { signal: timeoutSignal(VIETQR_TIMEOUT_MS), cache: 'no-store' })

    if (!response.ok || !(response.headers.get('content-type') ?? '').startsWith('image/')) {
      throw new VietQrServiceError(`VietQR image failed (${response.status}).`, 'upstream')
    }

    return { image: Buffer.from(await response.arrayBuffer()), source: 'quick_link' }
  } catch (error) {
    if (error instanceof VietQrServiceError) throw error
    if (isAbort(error)) throw new VietQrServiceError('VietQR did not answer in time.', 'timeout')

    throw new VietQrServiceError(error instanceof Error ? error.message : 'VietQR request failed.', 'upstream')
  }
}

/**
 * Uploads the QR PNG to the IPS storage (same MinIO configuration as the project logo) and returns its public
 * URL — the value saved in `qr_code_url` (never base64).
 */
export async function uploadBankQrImage({ projectId, group, image }: { projectId: number; group: string; image: Buffer }) {
  const endpoint = process.env.MINIO_PUBLIC_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new VietQrServiceError('Storage is not configured (MINIO_PUBLIC_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY).', 'storage')
  }

  if (image.length === 0 || image.length > MAX_QR_IMAGE_BYTES) throw new VietQrServiceError('Invalid QR image size.', 'upstream')

  const client = new S3Client({ endpoint, region: process.env.MINIO_REGION ?? 'us-east-1', credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true })
  const now = new Date()
  const object_key = `project-bank-qr/${projectId}/${group}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.png`

  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: object_key, Body: image, ContentType: 'image/png', ContentLength: image.length }))
  } catch (error) {
    throw new VietQrServiceError(error instanceof Error ? error.message : 'Upload QR failed.', 'storage')
  }

  return `${endpoint.replace(/\/$/, '')}/${bucket}/${object_key}`
}
