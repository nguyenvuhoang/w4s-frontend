import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'

const EXPIRES_IN = 300
const ALLOWED_PREFIXES = ['announcements/avatar/']

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

function isValidAnnouncementStorageKey(object_key: string) {
  if (!ALLOWED_PREFIXES.some(prefix => object_key.startsWith(prefix))) return false
  if (object_key.includes('..') || object_key.includes('\\')) return false
  if (object_key.startsWith('/') || object_key.includes('//')) return false

  return /^[a-zA-Z0-9._\-/]+$/.test(object_key)
}

export async function GET(req: NextRequest) {
  try {
    const backendCredential = await getBackendToken(req)

    if (!backendCredential) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const object_key = req.nextUrl.searchParams.get('object_key') ?? ''

    if (!object_key) {
      return NextResponse.json({ success: false, message: 'Missing object_key.' }, { status: 400 })
    }

    if (!isValidAnnouncementStorageKey(object_key)) {
      return NextResponse.json({ success: false, message: 'Invalid object_key.' }, { status: 400 })
    }

    const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'
    const client = getS3Client()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: object_key,
      ResponseContentDisposition: 'inline',
    })

    const view_url = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN })

    return NextResponse.json({
      success: true,
      data: {
        view_url,
        expires_in: EXPIRES_IN,
      },
    })
  } catch (error: any) {
    logger.error('storage prepare-view error:', error)

    return NextResponse.json(
      { success: false, message: error?.message ?? 'Unable to prepare view URL.' },
      { status: 500 }
    )
  }
}
