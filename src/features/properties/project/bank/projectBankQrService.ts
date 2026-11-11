import type { ProjectBankAccountGroup } from './projectBankTypes'

const BANK_QR_ENDPOINT = '/api/projects/bank-qr'
const CLIENT_TIMEOUT_MS = 25_000

export type ProjectBankQrErrorCode = 'timeout' | 'vietqr' | 'storage' | 'unauthorized' | 'invalid' | 'network'

export class ProjectBankQrError extends Error {
  constructor(readonly code: ProjectBankQrErrorCode, message: string) {
    super(message)
    this.name = 'ProjectBankQrError'
  }
}

const toErrorCode = (status: number, code: unknown): ProjectBankQrErrorCode => {
  if (status === 401 || status === 403) return 'unauthorized'
  if (status === 504 || code === 'vietqr_timeout' || code === 'banks_timeout') return 'timeout'
  if (code === 'storage') return 'storage'
  if (status === 400) return 'invalid'

  return 'vietqr'
}

/**
 * Creates the QR image of one project account through the IPS BFF (/api/projects/bank-qr) and returns the
 * stored IPS image URL. Nothing is saved on the project: the URL only fills `qr_code_url` in the form.
 */
export const projectBankQrService = {
  async createStoredQr({
    projectId,
    group,
    bin,
    values
  }: {
    projectId: number
    group: ProjectBankAccountGroup
    bin: string
    values: { account_number: string; account_holder: string; transfer_content: string }
  }): Promise<string> {
    let response: Response

    try {
      response = await fetch(BANK_QR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          group,
          bin,
          account_number: values.account_number,
          account_holder: values.account_holder,
          transfer_content: values.transfer_content
        }),
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS)
      })
    } catch (error) {
      const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')

      throw new ProjectBankQrError(timeout ? 'timeout' : 'network', error instanceof Error ? error.message : 'Network error.')
    }

    const json = await response.json().catch(() => null)
    const url = json?.data?.qr_code_url

    if (!response.ok || !json?.success || typeof url !== 'string' || !url) {
      throw new ProjectBankQrError(toErrorCode(response.status, json?.code), typeof json?.message === 'string' ? json.message : 'Unable to create the QR code.')
    }

    return url
  }
}

/** Downloads a QR image as a file; when the image host does not allow it (CORS), opens it in a new tab. */
export const downloadQrImage = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url, { mode: 'cors' })

    if (!response.ok) throw new Error(String(response.status))

    const objectUrl = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)

    return 'downloaded' as const
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')

    return 'opened' as const
  }
}
