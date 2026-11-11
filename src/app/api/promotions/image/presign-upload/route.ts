import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import logger from '@lib/logger'

const EXPIRES_IN = 300
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

const getS3Client = () => {
  const endpoint = process.env.MINIO_PUBLIC_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const region = process.env.MINIO_REGION ?? 'us-east-1'

  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('MinIO is not configured.')

  return new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true })
}

const getExtension = (fileName: string, contentType: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension && ALLOWED_EXTENSIONS.includes(extension)) return extension
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const projectId = Number(body.project_id)
    const fileName = String(body.file_name ?? 'promotion-image.png')
    const contentType = String(body.content_type ?? '')
    const fileSize = Number(body.file_size) || 0

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid project ID.' }, { status: 400 })
    }
    if (!ALLOWED_CONTENT_TYPES.includes(contentType) || !ALLOWED_EXTENSIONS.includes(fileName.split('.').pop()?.toLowerCase() ?? '')) {
      return NextResponse.json({ success: false, message: 'Invalid promotion image type.' }, { status: 400 })
    }
    if (fileSize <= 0 || fileSize > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: 'Promotion image must be 5MB or smaller.' }, { status: 400 })
    }

    const endpoint = process.env.MINIO_PUBLIC_ENDPOINT
    if (!endpoint) throw new Error('MinIO is not configured.')

    const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'
    const now = new Date()
    const objectKey = `promotions/${projectId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${getExtension(fileName, contentType)}`
    const uploadUrl = await getSignedUrl(getS3Client(), new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: fileSize
    }), { expiresIn: EXPIRES_IN })

    return NextResponse.json({
      success: true,
      data: {
        upload_url: uploadUrl,
        object_key: objectKey,
        image_url: `${endpoint.replace(/\/$/, '')}/${bucket}/${objectKey}`,
        expires_in: EXPIRES_IN
      }
    })
  } catch (error: any) {
    logger.error('promotion image presign-upload error:', error)
    return NextResponse.json({ success: false, message: error?.message ?? 'Unable to prepare promotion image upload.' }, { status: 500 })
  }
}
