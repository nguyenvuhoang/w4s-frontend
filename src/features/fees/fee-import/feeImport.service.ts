import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'

import type { FeeExcelDuplicatePolicy } from './feeImport.types'

const TEMPLATE_PATH = '/api/fees/import-template'
const VALIDATE_PATH = '/api/fees/excel-import/validate'
const IMPORT_PATH = '/api/fees/excel-import'

const getMessage = (payload: any, fallback: string) => {
  const first = Array.isArray(payload?.errors) ? payload.errors[0] : null
  const message = payload?.error_message ?? payload?.errorMessage ?? first?.info ?? first?.message ?? payload?.message ?? payload?.data?.message
  return typeof message === 'string' && message.trim() ? message.trim() : fallback
}

const getExecutionId = (payload: any) => {
  const first = Array.isArray(payload?.errors) ? payload.errors[0] : null
  const value = payload?.execution_id ?? payload?.executionId ?? first?.execution_id ?? first?.executionId
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export class FeeExcelImportError extends Error {
  executionId: string | null

  constructor(message: string, executionId: string | null = null) {
    super(message)
    this.name = 'FeeExcelImportError'
    this.executionId = executionId
  }
}

export const parseContentDispositionFilename = (header: string | null) => {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try { return decodeURIComponent(encoded.trim()) } catch { return encoded.trim() }
  }
  return header?.match(/filename="?([^";]+)"?/i)?.[1]?.trim() ?? ''
}

const headers = (language?: Locale | string, projectCode?: string) => ({
  app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
  ...(language ? { lang: String(language) } : {}),
  ...(projectCode ? { scope: projectCode } : {}),
  'X-TimeZone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
})

const submitFile = async (path: string, fields: Record<string, string>, file: File, language: Locale | string | undefined, projectCode: string, failedMessage: string) => {
  const formData = new FormData()
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value))
  formData.append('File', file)

  const response = await fetch(path, { method: 'POST', headers: headers(language, projectCode), body: formData })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) throw new FeeExcelImportError(getMessage(payload, failedMessage), getExecutionId(payload))
  return payload
}

export const feeImportService = {
  downloadTemplate: async ({ language, projectCode, failedMessage }: { language?: Locale | string; projectCode?: string; failedMessage: string }) => {
    const response = await fetch(TEMPLATE_PATH, { method: 'GET', headers: headers(language, projectCode) })
    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok || contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null)
      throw new FeeExcelImportError(getMessage(payload, failedMessage), getExecutionId(payload))
    }
    const blob = await response.blob()
    if (!blob.size) throw new FeeExcelImportError(failedMessage)
    return { blob, filename: parseContentDispositionFilename(response.headers.get('content-disposition')) || 'fee-import-template.xlsx' }
  },
  validate: (file: File, projectId: number, projectCode: string, language: Locale | string | undefined, failedMessage: string) =>
    submitFile(VALIDATE_PATH, { ProjectId: String(projectId) }, file, language, projectCode, failedMessage),
  import: (file: File, projectId: number, projectCode: string, feePeriodId: number, duplicatePolicy: FeeExcelDuplicatePolicy, notes: string, language: Locale | string | undefined, failedMessage: string) => {
    const trimmedNotes = notes.trim()

    return submitFile(IMPORT_PATH, { ProjectId: String(projectId), FeePeriodId: String(feePeriodId), DuplicatePolicy: duplicatePolicy, ...(trimmedNotes ? { notes: trimmedNotes } : {}) }, file, language, projectCode, failedMessage)
  }
}
