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
    throw new Error('MinIO chưa được cấu hình (MINIO_PUBLIC_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY).')
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

function getAvatarUrl(endpoint: string, bucket: string, object_key: string) {
  return `${endpoint.replace(/\/$/, '')}/${bucket}/${object_key}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const user_code: string = body.user_code ?? ''
    const file_name: string = body.file_name ?? 'avatar.png'
    const content_type: string = body.content_type || 'image/png'
    const file_size: number = Number(body.file_size) || 0

    if (!user_code) {
      return NextResponse.json({ success: false, message: 'Thiếu user_code.' }, { status: 400 })
    }

    if (!ALLOWED_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json({ success: false, message: 'File avatar không hợp lệ.' }, { status: 400 })
    }

    if (file_size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: 'Ảnh avatar phải nhỏ hơn hoặc bằng 5MB.' }, { status: 400 })
    }

    const public_endpoint = process.env.MINIO_PUBLIC_ENDPOINT
    const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'

    if (!public_endpoint) {
      throw new Error('MinIO chưa được cấu hình (MINIO_PUBLIC_ENDPOINT).')
    }

    const client = getS3Client()
    const extension = getExtension(file_name, content_type)
    const now = new Date()
    const yyyy = now.getUTCFullYear()
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
    const safe_user_code = user_code.replace(/[^a-zA-Z0-9._-]/g, '_')
    const object_key = `avatars/${safe_user_code}/${yyyy}/${mm}/${randomUUID()}.${extension}`

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
        bucket_name: bucket,
        object_key,
        avatar_url: getAvatarUrl(public_endpoint, bucket, object_key),
        expires_in: EXPIRES_IN,
      },
    })
  } catch (error: any) {
    logger.error('avatar presign-upload error:', error)

    return NextResponse.json(
      { success: false, message: error?.message ?? 'Không thể tạo presigned upload URL cho avatar.' },
      { status: 500 }
    )
  }
}
