import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const EXPIRES_IN = 300 // 5 phút

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
    forcePathStyle: true, // MinIO yêu cầu path-style
  })
}

function buildObjectKey(
  module_code: string,
  project_id: number,
  parent_id: number,
  file_name: string
): string {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const guid = uuidv4().replace(/-/g, '').slice(0, 8)
  const safe_name = file_name.replace(/[^a-zA-Z0-9._-]/g, '_')

  return `${module_code}/${project_id}/${parent_id}/${yyyy}/${mm}/${guid}_${safe_name}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const module_code: string = body.module_code ?? ''
    const parent_id: number = Number(body.parent_id)
    const project_id: number = Number(body.project_id) || 0
    const file_name: string = body.file_name ?? ''
    const mime_type: string = body.mime_type || 'application/octet-stream'
    const file_size: number = Number(body.file_size) || 0

    if (!module_code || !parent_id || !file_name) {
      return NextResponse.json(
        { success: false, message: 'Thiếu module_code, parent_id hoặc file_name.' },
        { status: 400 }
      )
    }

    const bucket = process.env.MINIO_BUCKET ?? 'ips-documents'
    const object_key = buildObjectKey(module_code, project_id, parent_id, file_name)

    const client = getS3Client()

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: object_key,
      ContentType: mime_type,
      ContentLength: file_size > 0 ? file_size : undefined,
    })

    const upload_url = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN })

    return NextResponse.json({
      success: true,
      data: {
        upload_url,
        bucket_name: bucket,
        object_key,
        expires_in: EXPIRES_IN
      }
    })
  } catch (error: any) {
    logger.error('presign-upload error:', error)
    return NextResponse.json(
      { success: false, message: error?.message ?? 'Không thể tạo presigned URL.' },
      { status: 500 }
    )
  }
}
