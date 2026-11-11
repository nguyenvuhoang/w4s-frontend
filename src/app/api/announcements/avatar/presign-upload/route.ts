import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import logger from '@lib/logger'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const EXPIRES_IN = 300
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

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

function getExtension(file_name: string, content_type: string) {
  const extension = file_name.split('.').pop()?.toLowerCase()

  if (extension && ALLOWED_EXTENSIONS.includes(extension)) return extension
  if (content_type === 'image/png') return 'png'
  if (content_type === 'image/jpeg' || content_type === 'image/jpg') return 'jpg'
  if (content_type === 'image/webp') return 'webp'

  return 'png'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const file_name: string = body.file_name ?? 'announcement-avatar.png'
    const content_type: string = body.content_type || 'image/png'
    const file_size: number = Number(body.file_size) || 0

    if (!ALLOWED_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json({ success: false, message: 'Invalid announcement avatar image type.' }, { status: 400 })
    }

    const extension = getExtension(file_name, content_type)
    const originalExtension = file_name.split('.').pop()?.toLowerCase() ?? extension

    if (!ALLOWED_EXTENSIONS.includes(originalExtension)) {
      return NextResponse.json({ success: false, message: 'Invalid announcement avatar file extension.' }, { status: 400 })
    }

    if (file_size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: 'Announcement avatar image must be 5MB or smaller.' }, { status: 400 })
    }

    const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'

    const client = getS3Client()
    const now = new Date()
    const yyyy = now.getUTCFullYear()
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
    const object_key = `announcements/avatar/${yyyy}/${mm}/${randomUUID()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: object_key,
      ContentType: content_type,
      ContentLength: file_size > 0 ? file_size : undefined,
    })

    const upload_url = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN })

    return NextResponse.json({
      success: true,
      data: {
        upload_url,
        object_name: object_key,
        object_key,
        bucket_name: bucket,
        expires_in: EXPIRES_IN,
      },
    })
  } catch (error: any) {
    logger.error('announcement avatar presign-upload error:', error)

    return NextResponse.json(
      { success: false, message: error?.message ?? 'Unable to create presigned upload URL for announcement avatar.' },
      { status: 500 }
    )
  }
}
