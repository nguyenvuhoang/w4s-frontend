import { env } from '@/env.mjs'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const cmsApiUrl = env.CMS_HOST
  const adminPassword = env.CMS_CACHE_ADMIN_PASSWORD

  if (!cmsApiUrl || !adminPassword) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        data: {
          message: 'Missing CMS cache configuration on server'
        }
      },
      { status: 500 }
    )
  }

  const baseUrl = cmsApiUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/api/cache/clearall?adminPassword=${encodeURIComponent(adminPassword)}`
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    })

    const responseText = await response.text()
    let responseData: unknown = null

    if (responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }
    }

    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        data: responseData
      },
      { status: response.status }
    )
  } catch (error: any) {
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError'

    return NextResponse.json(
      {
        success: false,
        status: isTimeout ? 504 : 500,
        data: {
          message: isTimeout ? 'Cache clear request timed out' : 'Failed to clear cache'
        }
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
