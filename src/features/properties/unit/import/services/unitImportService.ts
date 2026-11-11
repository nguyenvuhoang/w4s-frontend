import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'

import type { UnitImportSubmitPayload, UnitImportSubmitResult } from '../types'

const APARTMENT_IMPORT_VALIDATE_PATH = '/api/apartment/import-validate'
const APARTMENT_IMPORT_PATH = '/api/apartment/import'
/** BFF of POST /ips/api/ImportTemplate/DownloadTemplate ({ template_code: 'APARTMENT' }). */
export const APARTMENT_IMPORT_TEMPLATE_PATH = '/api/apartment/import-template'
/** Browser-side name only, used when the Backend response has no Content-Disposition filename. */
export const APARTMENT_IMPORT_TEMPLATE_FALLBACK_FILENAME = 'Apartment_Import_Template.xlsx'

type UnitImportServiceOptions = {
  sessiontoken?: string
  language?: Locale | string
}

export class UnitImportValidateError extends Error {
  status: number
  execution_id: string | null

  constructor(message: string, status: number, execution_id: string | null = null) {
    super(message)
    this.name = 'UnitImportValidateError'
    this.status = status
    this.execution_id = execution_id
  }
}

/**
 * Best-effort extraction of a human message out of whatever shape the proxy/backend returned —
 * mirrors generateFeeService.ts's extractBackendValidationMessage since apartmentimport/validate
 * and apartments/import are assumed to follow the same error envelope as the confirmed
 * feeexcelimport/validate contract ({ success: false, error_message/error_code, execution_id },
 * no message/errors[] envelope).
 */
const extractApiErrorMessage = (payload: any, fallback: string): string => {
  const message = payload?.error_message
    ?? payload?.errorMessage
    ?? payload?.errors?.[0]?.info
    ?? payload?.errors?.[0]?.message
    ?? payload?.error_code
    ?? payload?.errorCode
    ?? payload?.message
    ?? payload?.data?.message
    ?? payload?.description

  return typeof message === 'string' && message.trim() ? message.trim() : fallback
}

/** `execution_id` lives at the response root only (confirmed contract) — never inside `data`. */
const extractApiExecutionId = (payload: any): string | null => {
  const executionId = payload?.execution_id ?? payload?.executionId

  return typeof executionId === 'string' && executionId.trim() ? executionId.trim() : null
}

export class UnitImportSubmitError extends Error {
  execution_id: string | null

  constructor(message: string, execution_id: string | null = null) {
    super(message)
    this.name = 'UnitImportSubmitError'
    this.execution_id = execution_id
  }
}

export class UnitImportTemplateError extends Error {
  execution_id: string | null

  constructor(message: string, execution_id: string | null = null) {
    super(message)
    this.name = 'UnitImportTemplateError'
    this.execution_id = execution_id
  }
}

export type UnitImportTemplateFile = {
  blob: Blob
  filename: string
}

/** Filename of a Content-Disposition header (RFC 5987 `filename*=UTF-8''...` first), '' when absent. */
export const parseContentDispositionFilename = (contentDisposition: string | null) => {
  if (!contentDisposition) return ''

  const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]

  if (encodedFilename) {
    try {
      return decodeURIComponent(encodedFilename.trim())
    } catch {
      return encodedFilename.trim()
    }
  }

  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim() ?? ''
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
    acc[normalizeKey(key)] = item[key]

    return acc
  }, {})

  for (const key of keys) {
    const value = normalizedMap[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

export const unitImportService = {
  /**
   * Apartment import template, as produced by the Backend (never generated on the FE). The BFF resolves the
   * session credential and sends exactly `{ template_code: 'APARTMENT' }` upstream; any JSON / error / empty
   * response is raised as an error, so no empty file is ever downloaded.
   */
  downloadApartmentImportTemplate: async (
    options: Pick<UnitImportServiceOptions, 'language'> & { failedMessage: string }
  ): Promise<UnitImportTemplateFile> => {
    const headers: Record<string, string> = { app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO' }

    if (options.language) headers.lang = String(options.language)

    const response = await fetch(APARTMENT_IMPORT_TEMPLATE_PATH, { method: 'POST', headers })
    const contentType = response.headers.get('content-type') ?? ''

    if (!response.ok || contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null)

      throw new UnitImportTemplateError(extractApiErrorMessage(payload, options.failedMessage), extractApiExecutionId(payload))
    }

    const blob = await response.blob()

    if (blob.size === 0) throw new UnitImportTemplateError(options.failedMessage)

    return {
      blob,
      filename: parseContentDispositionFilename(response.headers.get('content-disposition')) || APARTMENT_IMPORT_TEMPLATE_FALLBACK_FILENAME
    }
  },

  /**
   * Uploads the Excel file to the apartment import validation proxy (/api/apartment/import-validate
   * -> ips/api/apartmentimport/validate) together with the current project id, and returns the raw
   * backend payload as-is — mapping into UnitImportValidationSummary happens in
   * unitImportBackendMapper so this stays a thin, testable network call (mirrors
   * generateFeeService.validateGenerateFeeFile).
   */
  validateUnitImportFile: async (
    file: File,
    options: UnitImportServiceOptions & { projectId: number; requestFailedMessage: string }
  ): Promise<unknown> => {
    const formData = new FormData()

    formData.append('File', file)
    // Assumed to bind the backend DTO's `ProjectId` (PascalCase), matching the confirmed
    // feeexcelimport/validate contract — see the route handler's validateFormData comment.
    formData.append('ProjectId', String(options.projectId))

    const headers: Record<string, string> = {
      app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
    }

    if (options.sessiontoken) headers.uid = options.sessiontoken
    if (options.language) headers.lang = String(options.language)

    const response = await fetch(APARTMENT_IMPORT_VALIDATE_PATH, {
      method: 'POST',
      headers,
      body: formData
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.success === false) {
      throw new UnitImportValidateError(
        extractApiErrorMessage(payload, options.requestFailedMessage),
        response.status,
        extractApiExecutionId(payload)
      )
    }

    return payload
  },

  /**
   * Commits the already-validated apartment list via POST /api/apartment/import
   * (-> ips/api/apartments/import) — a direct REST call, not a workflowid/fields-wrapped workflow
   * call. The body sent upstream is exactly `{ project_id, duplicate_policy, items }`, no envelope.
   * `payload.items` is expected to be the validate response's own `data.apartments[]`, forwarded
   * through unchanged (every field the backend returned, including any not read by the UI) — no
   * re-derivation from the (pagination-sliced) preview table.
   */
  submitUnitImport: async (
    payload: UnitImportSubmitPayload,
    options: UnitImportServiceOptions & { failedMessage: string }
  ): Promise<UnitImportSubmitResult> => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
    }

    if (options.sessiontoken) headers.uid = options.sessiontoken
    if (options.language) headers.lang = String(options.language)

    const response = await fetch(APARTMENT_IMPORT_PATH, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    const responsePayload = await response.json().catch(() => null)

    if (!response.ok || responsePayload?.success === false) {
      throw new UnitImportSubmitError(
        extractApiErrorMessage(responsePayload, options.failedMessage),
        extractApiExecutionId(responsePayload)
      )
    }

    const root = responsePayload?.data ?? responsePayload

    return {
      total_count: toNullableNumber(getField(root, ['total_count', 'totalCount'])),
      created_count: toNullableNumber(getField(root, ['created_count', 'createdCount', 'inserted_count', 'insertedCount'])),
      updated_count: toNullableNumber(getField(root, ['updated_count', 'updatedCount'])),
      skipped_count: toNullableNumber(getField(root, ['skipped_count', 'skippedCount', 'duplicate_count', 'duplicateCount'])),
      error_count: toNullableNumber(getField(root, ['error_count', 'errorCount', 'failed_count', 'failedCount'])),
      execution_id: extractApiExecutionId(responsePayload)
    }
  }
}
