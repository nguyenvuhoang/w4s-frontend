import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

// Generic MinIO object listing for image pickers (e.g. the announcement media library).
// Presigned view URLs for each returned object_key are issued separately by
// /api/storage/prepare-view — this endpoint only lists keys/metadata, never a direct URL.
// Restricted to a small allow-list of prefixes so this endpoint cannot be used to enumerate
// unrelated folders/buckets content by passing an arbitrary `prefix`.
const ALLOWED_PREFIXES = ['announcements/avatar/']
const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100
// No metadata database backs this listing — objects are scanned directly from the MinIO bucket.
// This caps how many keys are scanned/sorted per request so browsing stays fast; if the folder
// grows past this, replace the raw bucket scan with a DB-tracked workflow (WF_BO_...) that mirrors
// this endpoint's { items, total_count, has_next_page } shape.
const MAX_SCAN_KEYS = 1000

function getS3Client() {
  const endpoint = process.env.MINIO_PUBLIC_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const region = process.env.MINIO_REGION ?? 'us-east-1'

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO is not configured.')
  }

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

function isAllowedPrefix(prefix: string) {
  if (!prefix || prefix.includes('..') || prefix.startsWith('/')) return false

  return ALLOWED_PREFIXES.some(allowed => prefix === allowed || prefix.startsWith(allowed))
}

function deriveFileName(key: string) {
  return key.split('/').pop() || key
}

function deriveContentType(file_name: string) {
  const extension = file_name.split('.').pop()?.toLowerCase()

  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'webp') return 'image/webp'

  return 'application/octet-stream'
}

export async function GET(req: NextRequest) {
  try {
    const backendCredential = await getBackendToken(req)

    if (!backendCredential) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const prefix = searchParams.get('prefix') ?? ''

    if (!isAllowedPrefix(prefix)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing prefix.' }, { status: 400 })
    }

    const search = (searchParams.get('search') ?? '').trim().toLowerCase()
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const page_size = Math.min(Math.max(Number(searchParams.get('page_size')) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)

    const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'
    const client = getS3Client()

    const objects: { Key?: string; Size?: number; LastModified?: Date }[] = []
    let continuationToken: string | undefined

    do {
      const response = await client.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      }))

      objects.push(...(response.Contents ?? []))
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
    } while (continuationToken && objects.length < MAX_SCAN_KEYS)

    objects.sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0))

    const filtered = search
      ? objects.filter(object => deriveFileName(object.Key ?? '').toLowerCase().includes(search))
      : objects

    const total_count = filtered.length
    const offset = (page - 1) * page_size
    const pageItems = filtered.slice(offset, offset + page_size)
    const has_next_page = offset + page_size < total_count

    const items = pageItems
      .filter((object): object is { Key: string; Size?: number; LastModified?: Date } => Boolean(object.Key))
      .map(object => {
        const file_name = deriveFileName(object.Key)

        return {
          object_key: object.Key,
          file_name,
          size: object.Size ?? 0,
          last_modified: object.LastModified?.toISOString() ?? '',
          content_type: deriveContentType(file_name)
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        items,
        total_count,
        page,
        page_size,
        has_next_page
      }
    })
  } catch (error: any) {
    logger.error('storage images list error:', error)

    return NextResponse.json(
      { success: false, message: error?.message ?? 'Unable to list images.' },
      { status: 500 }
    )
  }
}
