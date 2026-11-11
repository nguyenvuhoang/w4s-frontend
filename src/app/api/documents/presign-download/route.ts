import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'

const EXPIRES_IN = 300 // 5 phút

function getS3Client() {
  const rawEndpoint = process.env.MINIO_PUBLIC_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const region = process.env.MINIO_REGION ?? 'us-east-1'

  if (!rawEndpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'MinIO chưa được cấu hình (MINIO_PUBLIC_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY).'
    )
  }

  /*
   * Endpoint chỉ được là origin
   * https://storage.vknight.io.vn
   *
   */
  const endpoint = rawEndpoint.replace(/\/+$/, '')

  const endpointUrl = new URL(endpoint)

  if (endpointUrl.pathname !== '/' && endpointUrl.pathname !== '') {
    throw new Error(
      `MINIO_PUBLIC_ENDPOINT không được chứa path hoặc bucket. Giá trị hiện tại: ${endpointUrl.pathname}`
    )
  }

  return new S3Client({
    endpoint: endpointUrl.origin,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })
}

function normalizeObjectKey(rawObjectKey: string, bucket: string): string {
  let objectKey = rawObjectKey
    .trim()
    .replaceAll('\\', '/')
    .replace(/^\/+/, '')

  const bucketPrefix = `${bucket.replace(/^\/+|\/+$/g, '')}/`

  // Loại bỏ bucket nếu frontend hoặc database đã lưu kèm bucket.
  while (objectKey.toLowerCase().startsWith(bucketPrefix.toLowerCase())) {
    objectKey = objectKey.slice(bucketPrefix.length).replace(/^\/+/, '')
  }

  // Gom nhiều dấu slash liên tiếp thành một.
  objectKey = objectKey.replace(/\/{2,}/g, '/')

  if (!objectKey) {
    throw new Error('object_key không hợp lệ.')
  }

  // Không cho phép path traversal.
  if (
    objectKey === '..' ||
    objectKey.startsWith('../') ||
    objectKey.includes('/../')
  ) {
    throw new Error('object_key không hợp lệ.')
  }

  return objectKey
}

function buildContentDisposition(
  mode: 'inline' | 'attachment',
  fileName: string
): string {
  if (!fileName) {
    return mode
  }

  const normalizedFileName = fileName
    .replaceAll('\\', '_')
    .replaceAll('/', '_')
    .replaceAll('"', "'")
    .replace(/[\r\n]/g, '')

  const asciiFallback = normalizedFileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')

  return (
    `${mode}; filename="${asciiFallback}"; ` +
    `filename*=UTF-8''${encodeURIComponent(normalizedFileName)}`
  )
}

/**
 * GET /api/documents/presign-download
 *
 * Query params:
 *   object_key — MinIO object key
 *   file_name  — tên file gốc, tùy chọn
 *   mode       — "inline" hoặc "attachment"
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    const rawObjectKey = searchParams.get('object_key') ?? ''
    const fileName = searchParams.get('file_name') ?? ''
    const mode: 'inline' | 'attachment' =
      searchParams.get('mode') === 'attachment'
        ? 'attachment'
        : 'inline'

    if (!rawObjectKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Thiếu object_key.',
        },
        {
          status: 400,
        }
      )
    }

    const bucket = (
      process.env.MINIO_BUCKET ?? 'ips-documents'
    ).replace(/^\/+|\/+$/g, '')

    const objectKey = normalizeObjectKey(rawObjectKey, bucket)
    const client = getS3Client()

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ResponseContentDisposition: buildContentDisposition(mode, fileName),
    })

    const downloadUrl = await getSignedUrl(client, command, {
      expiresIn: EXPIRES_IN,
    })

    logger.info('Created MinIO presigned download URL', {
      bucket,
      objectKey,
      mode,
    })

    return NextResponse.json({
      success: true,
      data: {
        download_url: downloadUrl,
        object_key: objectKey,
        expires_in: EXPIRES_IN,
      },
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Không thể tạo presigned download URL.'

    logger.error('presign-download error:', error)

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    )
  }
}