import { NextRequest, NextResponse } from 'next/server'

import { WORKING_PROJECT_SCOPE_COOKIE } from '@/shared/constants/projectContext'
import { getBackendToken } from '@/server/auth/getBackendToken'
import { boContextService } from '@/shared/services/boContextService'
import logger from '@lib/logger'

export const dynamic = 'force-dynamic'

const cookieOptions = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const
}

export async function POST(request: NextRequest) {
  const projectCode = String((await request.json().catch(() => ({}))).project_code ?? '').trim()
  const backendCredential = await getBackendToken(request)

  if (!backendCredential || !projectCode) {
    return NextResponse.json({ message: 'Working project is required.' }, { status: 400 })
  }

  try {
    const context = await boContextService.getContext({
      sessiontoken: backendCredential.accessToken,
      language: request.headers.get('lang') ?? undefined
    })
    const project = context.projects.find(item => item.code === projectCode)

    if (!project) {
      return NextResponse.json({ message: 'The selected project is not available.' }, { status: 403 })
    }

    const response = NextResponse.json({ project_code: project.code })
    response.cookies.set(WORKING_PROJECT_SCOPE_COOKIE, project.code, cookieOptions)

    return response
  } catch (error) {
    logger.error('[project-context] Unable to synchronize working project', error)

    return NextResponse.json({ message: 'Unable to synchronize the selected project.' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(WORKING_PROJECT_SCOPE_COOKIE, '', {
    ...cookieOptions,
    expires: new Date(0),
    maxAge: 0
  })

  return response
}
