import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getBackendToken } from '@/server/auth/getBackendToken'

/**
 * Lấy presigned GET URL cho tài liệu từ MinIO.
 *
 * GET /api/documents/download?id=<document_id>
 *
 * Backend (WF_BO_GET_DOCUMENT_DOWNLOAD_URL) phải:
 *   - Đọc object_key từ document table theo id
 *   - Tạo presigned GET URL với MINIO_PUBLIC_ENDPOINT (https://storage-api.vknight.io.vn)
 *     KHÔNG dùng MINIO_INTERNAL_ENDPOINT (http://ips-minio:9000)
 *   - Expire 5 phút
 *   - Bucket vẫn private
 *
 * Response từ workflow: { data: { download_url: "https://storage-api.vknight.io.vn/..." } }
 */
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ message: 'Thiếu id tài liệu.' }, { status: 400 })
    }

    const backendCredential = await getBackendToken(req)

    if (!backendCredential) {
      return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
    }

    const tokenInfo = backendCredential.accessToken
    const appCode = req.headers.get('app') ?? 'SYS'

    const endpoint = process.env.NEXT_PUBLIC_REST_API_ENDPOINT
    if (!endpoint) {
      return NextResponse.json({ message: 'Backend endpoint chưa được cấu hình.' }, { status: 500 })
    }

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        uid: tokenInfo,
        app: appCode,
      },
      body: JSON.stringify({
        workflowid: 'WF_BO_GET_DOCUMENT_DOWNLOAD_URL',
        fields: { id: Number(id) }
      }),
      signal: AbortSignal.timeout(15_000)
    })

    const data = await safeParseJSON(upstream)

    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message ?? 'Không thể lấy link tải xuống.' },
        { status: upstream.status }
      )
    }

    const downloadUrl: string =
      data?.data?.download_url ??
      data?.dataresponse?.data?.download_url ??
      ''

    if (!downloadUrl) {
      return NextResponse.json({ message: 'Backend không trả về link tải xuống.' }, { status: 404 })
    }

    return NextResponse.json({ download_url: downloadUrl })
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return NextResponse.json({ message: 'Timeout khi lấy link tải xuống.' }, { status: 504 })
    }

    logger.error('Document download URL error:', error)
    return NextResponse.json({ message: 'Không thể lấy link tải xuống.' }, { status: 500 })
  }
}

async function safeParseJSON(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
