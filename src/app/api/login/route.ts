// Next Imports
import { NextResponse } from 'next/server';

import type { UserTable } from './users';
import { env } from '@/env.mjs';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { i18n } from '@/configs/i18n';
import type { LoginErrorPayload } from '@features/auth/types';

type ResponseUser = Omit<UserTable, 'password'>

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const FETCH_TIMEOUT_MS = 30000;

const buildErrorPayload = (
  message: string,
  error_code: string | null = null,
  execution_id: string | null = null,
  type_error: string = 'danger'
): LoginErrorPayload => ({ message, error_code, execution_id, type_error })

export async function POST(req: Request) {
  // Vars
  const { username, password } = await req.json()

  const my_device = JSON.stringify(req.headers.get('my_device')) || '{}'

  const headerrequest = {
    'content-type': 'application/json',
    'lang': req.headers.get('lang') || i18n.defaultLocale,
    'app': req.headers.get('app') || 'SYS',
    'my_device': JSON.parse(my_device),
    'uid': ""
  }

  const bodyrequest = JSON.stringify({
    workflowid: WORKFLOWCODE.WF_BO_LOGIN,
    fields: {
      login_name: username,
      password: password,
    },
  })

  const endpoint = `${env.NEXT_PUBLIC_REST_API_ENDPOINT}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let requestLogin: Response
  try {
    requestLogin = await fetch(endpoint, {
      method: 'POST',
      headers: headerrequest,
      body: bodyrequest,
      signal: controller.signal,
    });
  } catch {
    // Real network failure or timeout — this is the only case allowed to report "server unavailable".
    return NextResponse.json(
      buildErrorPayload('The server is temporarily unavailable. Please try again later!', 'SERVER_UNAVAILABLE'),
      { status: 503 }
    )
  } finally {
    clearTimeout(timeoutId)
  }

  let dataresponse: any
  try {
    dataresponse = await requestLogin.json()
  } catch {
    // Backend actually returned non-JSON/invalid content.
    return NextResponse.json(
      buildErrorPayload('The server returned an invalid response. Please try again later!', 'INVALID_RESPONSE'),
      { status: 502 }
    )
  }

  const errors = Array.isArray(dataresponse?.errors) ? dataresponse.errors : []

  if (requestLogin.ok && errors.length === 0) {
    const response: ResponseUser = dataresponse.data
    return NextResponse.json(response)
  }

  // Business error from the workflow — key === "500" does NOT mean the server is down,
  // it can still be a legitimate business error (e.g. account.temporarily.locked). Never
  // overwrite it with a generic "server unavailable" message.
  const firstError = errors[0] ?? {}
  const message = String(
    firstError.info
    ?? firstError.message
    ?? dataresponse?.message
    ?? 'Login failed. Please try again.'
  )
  const error_code: string | null = firstError.code ?? null
  const execution_id: string | null = String(
    firstError.execute_id
    ?? firstError.execution_id
    ?? dataresponse?.execution_id
    ?? ''
  ) || null
  const type_error: string = firstError.type_error ?? 'danger'

  const payload = buildErrorPayload(message, error_code, execution_id, type_error)

  if (error_code === 'HAVELOGGED') {
    return NextResponse.json(payload, { status: 299 })
  }

  return NextResponse.json(payload, { status: 401 })
}
