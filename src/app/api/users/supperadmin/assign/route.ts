import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getBackendToken } from '@/server/auth/getBackendToken'

const ASSIGN_ADMIN_PATH = '/cth/api/supperadmin/assign'

const getBaseUrl = () => (
  process.env.CMS_API_URL
  || process.env.CMS_HOST
  || 'https://cms.vknight.io.vn'
).replace(/\/$/, '')

const getErrorMessage = (payload: any, fallback: string) => (
  payload?.message
  ?? payload?.error
  ?? payload?.errors?.[0]?.message
  ?? payload?.errors?.[0]?.info
  ?? fallback
)

export async function POST(req: NextRequest) {
  try {
    const backendCredential = await getBackendToken(req)

    if (!backendCredential) {
      return NextResponse.json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const user_code = String(body?.user_code ?? '').trim()

    if (!user_code) {
      return NextResponse.json({ success: false, message: 'Thiếu user_code.' }, { status: 400 })
    }

    const response = await fetch(`${getBaseUrl()}${ASSIGN_ADMIN_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        uid: backendCredential.accessToken
      },
      body: JSON.stringify({ user_code })
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok || payload?.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: getErrorMessage(payload, 'Không thể chuyển user thành Quản Trị Viên.')
        },
        { status: response.status || 500 }
      )
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    logger.error('assign supperadmin error:', error)

    return NextResponse.json(
      { success: false, message: error?.message ?? 'Không thể chuyển user thành Quản Trị Viên.' },
      { status: 500 }
    )
  }
}
