import logger from '@lib/logger'
import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { PROJECT_BANK_ACCOUNT_GROUPS } from '@/features/properties/project/bank/projectBankTypes'
import { buildVietQrInput } from '@/features/properties/project/bank/vietqr'
import {
  createVietQrImage,
  fetchVietQrBanks,
  uploadBankQrImage,
  VietQrServiceError
} from '@/features/properties/project/bank/vietqr.server'

export const dynamic = 'force-dynamic'

const GROUPS = PROJECT_BANK_ACCOUNT_GROUPS.map(({ group }) => group as string)

// Mutating POST authenticated by the session cookie: same-origin only (same convention as /api/system-settings/branding).
const isSameOriginRequest = (req: NextRequest) => {
  const origin = req.headers.get('origin')

  if (!origin) return false

  try {
    return new URL(origin).origin === req.nextUrl.origin
  } catch {
    return false
  }
}

const fail = (status: number, code: string, message: string) => NextResponse.json({ success: false, code, message }, { status })

/**
 * Client -> this route -> VietQR (Generate API with server credentials, or Quick Link image) -> IPS storage.
 * Returns only the stored image URL for `qr_code_url`. It does not save the project: the user still has to
 * click "Save changes" (WF_BO_UPDATE_PROJECT). No credential, base64 or upstream payload is returned.
 */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return fail(403, 'forbidden', 'Forbidden.')

  const credential = await getBackendToken(req)

  if (!credential) return fail(401, 'unauthorized', 'Unauthorized.')

  const body = await req.json().catch(() => null)
  const projectId = Number(body?.project_id)
  const group = String(body?.group ?? '')

  if (!Number.isInteger(projectId) || projectId <= 0 || !GROUPS.includes(group)) return fail(400, 'invalid', 'Invalid request.')

  const { banks, error: banksError } = await fetchVietQrBanks()

  if (banksError) return fail(banksError === 'timeout' ? 504 : 502, `banks_${banksError}`, 'Unable to load the VietQR bank list.')

  // The input is rebuilt and validated here (BIN must be a VietQR bank; placeholder content is never encoded).
  const bank = banks.find(item => item.bin === String(body?.bin ?? '')) ?? null
  const result = buildVietQrInput(bank, {
    account_number: String(body?.account_number ?? ''),
    account_holder: String(body?.account_holder ?? ''),
    transfer_content: String(body?.transfer_content ?? '')
  })

  if (!result.ok) return fail(400, 'invalid_account', 'Bank, account number or account holder is missing or invalid.')

  try {
    const { image, source } = await createVietQrImage(result.input)
    const qr_code_url = await uploadBankQrImage({ projectId, group, image })

    return NextResponse.json({ success: true, data: { qr_code_url, source, placeholder_skipped: result.placeholderSkipped } })
  } catch (error) {
    logger.error('project bank-qr error:', error instanceof Error ? error.message : error)

    if (error instanceof VietQrServiceError) {
      if (error.reason === 'timeout') return fail(504, 'vietqr_timeout', 'VietQR did not answer in time.')
      if (error.reason === 'storage') return fail(500, 'storage', 'Unable to store the QR image.')

      return fail(502, 'vietqr_error', 'VietQR could not create the QR code.')
    }

    return fail(500, 'error', 'Unable to create the QR code.')
  }
}
