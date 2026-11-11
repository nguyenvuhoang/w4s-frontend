import { useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { DataMigrationError, getAvailableDataMigrationTables } from './dataMigrationService'

type Catalog =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; error: DataMigrationError }
  | { status: 'ready'; tables: string[] }

export const useDataMigrationTables = (locale: Locale) => {
  const activeRequest = useRef<AbortController | null>(null)
  const [catalog, setCatalog] = useState<Catalog>({ status: 'idle' })
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  useEffect(() => () => activeRequest.current?.abort(), [])

  const loadTables = async (service: string) => {
    activeRequest.current?.abort()
    setSelected(new Set())

    const request = new AbortController()

    activeRequest.current = request
    setCatalog({ status: 'loading' })

    try {
      const tables = await getAvailableDataMigrationTables(service, locale, request.signal)

      if (request.signal.aborted) return

      setSelected(new Set(tables))
      setCatalog({ status: 'ready', tables })
    } catch (error) {
      if (request.signal.aborted) return

      setCatalog({
        status: 'error',
        error: error instanceof DataMigrationError ? error : new DataMigrationError(502)
      })
    }
  }

  return { catalog, selected, setSelected, loadTables }
}
