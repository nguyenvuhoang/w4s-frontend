import { useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import type { DataMigrationOperation } from './dataMigrationConfig'
import { DataMigrationError, exportDataMigrationZip, importDataMigrationZip } from './dataMigrationService'

const downloadZip = ({ blob, filename }: { blob: Blob; filename: string }) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)

  try {
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }
}

export const useDataMigrationTransfer = (locale: Locale) => {
  const activeRequest = useRef(false)
  const [pending, setPending] = useState<DataMigrationOperation | null>(null)
  const [result, setResult] = useState<{
    operation: DataMigrationOperation
    error?: DataMigrationError
    description?: string
  } | null>(null)

  const run = async (operation: DataMigrationOperation, submit: () => Promise<void | string>) => {
    if (activeRequest.current) return false

    activeRequest.current = true
    setPending(operation)
    setResult(null)

    try {
      const description = await submit()

      setResult(description ? { operation, description } : { operation })

      return true
    } catch (caught) {
      setResult({ operation, error: caught instanceof DataMigrationError ? caught : new DataMigrationError(502) })

      return false
    } finally {
      activeRequest.current = false
      setPending(null)
    }
  }

  return {
    pending,
    result,
    clearResult: () => setResult(null),
    exportZip: (service: string, tables: readonly string[]) =>
      run('export', async () => downloadZip(await exportDataMigrationZip(service, tables, locale))),
    importZip: (service: string, file: File, preserveIdentity: boolean) =>
      run('import', () => importDataMigrationZip(service, file, preserveIdentity, locale))
  }
}
