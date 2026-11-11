import { NextResponse } from 'next/server'
import { getBackendToken } from '@/server/auth/getBackendToken'

/**
 * BFF route for src/servers/cnd-service (file upload to the CDN gateway). Mirrors
 * /api/system-service: the browser never gets the real backend token — it is resolved here
 * from the server-side session cookie via getBackendToken(), never trusted from a client header.
 */
export async function POST(req: Request) {
  const backendCredential = await getBackendToken(req)

  if (!backendCredential) {
    return NextResponse.json(
      { message: ['Phiên đăng nhập không hợp lệ.'] },
      { status: 401 }
    )
  }

  const formData = await req.formData()

  const url = new URL(req.url)
  const folderUpload = url.searchParams.get('folder')

  let cdnUrl = `${process.env.NEXT_PUBLIC_REST_API_CDN_ENDPOINT ?? ''}`
  if (folderUpload) {
    cdnUrl += `?folder=${folderUpload}`
  }

  const response = await fetch(cdnUrl, {
    method: 'POST',
    headers: {
      uid: backendCredential.accessToken,
      app: req.headers.get('app') || 'BO',
      lang: req.headers.get('lang') || 'en'
    },
    body: formData
  })

  const data = await response.json().catch(() => null)

  if (!response.ok && response.status !== 409) {
    return NextResponse.json(
      { message: `Upload failed (${response.status}): ${JSON.stringify(data)}` },
      { status: response.status }
    )
  }

  return NextResponse.json(data ?? {}, { status: response.status })
}
