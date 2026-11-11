import type { Locale } from '@/configs/i18n'
import { parseContentDispositionFilename } from '@/features/fees/fee-import/feeImport.service'

import {
  buildDataMigrationExportPayload, DATA_MIGRATION_API, isZipArchive, type DataMigrationOperation
} from './dataMigrationConfig'

export class DataMigrationError extends Error {
  constructor(readonly status: number, readonly executionId?: string, readonly invalidZip = false) {
    super('Data migration request failed')
  }
}

const requestHeaders = (locale: Locale) => ({
  lang: locale,
  'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
})

export const getAvailableDataMigrationTables = async (service: string, locale: Locale, signal: AbortSignal) => {
  const query = new URLSearchParams({ service })
  const response = await fetch(`${DATA_MIGRATION_API}/tables?${query}`, {
    headers: requestHeaders(locale),
    cache: 'no-store',
    signal
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !Array.isArray(payload?.tables)) {
    throw new DataMigrationError(response.ok ? 502 : response.status, payload?.execution_id)
  }

  return payload.tables as string[]
}

const sendTransferRequest = async (
  operation: DataMigrationOperation,
  service: string,
  locale: Locale,
  body: string | FormData,
  preserveIdentity?: boolean
) => {
  const query = new URLSearchParams({ service })

  if (preserveIdentity !== undefined) query.set('preserveIdentity', String(preserveIdentity))

  const response = await fetch(`${DATA_MIGRATION_API}/${operation}?${query}`, {
    method: 'POST',
    headers: {
      ...(typeof body === 'string' ? { 'content-type': 'application/json' } : {}),
      accept: operation === 'export' ? 'application/zip' : 'application/json',
      ...requestHeaders(locale)
    },
    body
  })

  if (!response.ok || (operation === 'export' && response.headers.get('content-type') !== 'application/zip')) {
    const payload = await response.json().catch(() => null)

    throw new DataMigrationError(response.ok ? 502 : response.status, payload?.execution_id, response.ok)
  }

  return response
}

export const exportDataMigrationZip = async (service: string, tables: readonly string[], locale: Locale) => {
  const body = JSON.stringify(buildDataMigrationExportPayload(tables))
  const response = await sendTransferRequest('export', service, locale, body)
  const blob = await response.blob()

  if (!await isZipArchive(blob)) {
    throw new DataMigrationError(502, undefined, true)
  }

  const filename = parseContentDispositionFilename(response.headers.get('content-disposition'))

  return {
    blob,
    filename: /^[^<>:"/\\|?*]+\.zip$/i.test(filename) ? filename : 'data-migration.zip'
  }
}

export const importDataMigrationZip = async (service: string, file: File, preserveIdentity: boolean, locale: Locale) => {
  const body = new FormData()

  body.append('file', file, file.name)

  const response = await sendTransferRequest('import', service, locale, body, preserveIdentity)
  const payload = await response.json().catch(() => null)

  if (payload?.success !== true) throw new DataMigrationError(502, payload?.execution_id)

  return typeof payload.description === 'string' ? payload.description : undefined
}
