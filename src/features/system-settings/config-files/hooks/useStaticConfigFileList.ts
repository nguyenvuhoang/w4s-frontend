'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ConfigFileApiError, configFileService } from '../services/configFileService'
import type { ConfigFilesDictionary, StaticConfigFileItem, StaticConfigFileSearchResult } from '../types'
import { configFileText } from '../components/configFileHelpers'

const DEFAULT_PAGE_SIZE = 10

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeItem = (value: any): StaticConfigFileItem => ({
  file_name: String(value?.file_name ?? value?.fileName ?? ''),
  relative_path: String(value?.relative_path ?? value?.relativePath ?? ''),
  size_bytes: typeof value?.size_bytes === 'number' ? value.size_bytes : toNumber(value?.sizeBytes, 0),
  last_modified_utc: typeof value?.last_modified_utc === 'string' ? value.last_modified_utc : value?.lastModifiedUtc
})

// Some backends reply with { success, data: { items, ... } }, others reply with the result
// object directly: { items, total_count, total_pages, page_index, page_size, ... }. Support
// both shapes instead of hardcoding payload.data.items, otherwise a real response reads empty.
const normalizeSearchResult = (payload: any, fallbackPageSize: number): StaticConfigFileSearchResult => {
  const data = payload?.data ?? payload ?? {}
  const items = Array.isArray(data.items) ? data.items.map(normalizeItem).filter((item: StaticConfigFileItem) => item.relative_path) : []

  return {
    items,
    totalCount: toNumber(data.total_count ?? data.totalCount, items.length),
    totalPages: toNumber(data.total_pages ?? data.totalPages, 1),
    pageIndex: toNumber(data.page_index ?? data.pageIndex, 0),
    pageSize: toNumber(data.page_size ?? data.pageSize, fallbackPageSize),
    hasPreviousPage: Boolean(data.has_previous_page ?? data.hasPreviousPage),
    hasNextPage: Boolean(data.has_next_page ?? data.hasNextPage)
  }
}

const toErrorMessage = (error: unknown, dictionary: ConfigFilesDictionary, fallback: string) => {
  const message = error instanceof Error ? error.message : fallback

  if (error instanceof ConfigFileApiError && error.executionId) {
    return `${message} ${configFileText(dictionary, 'config_files_error_reference_label', 'Error Reference')}: ${error.executionId}`
  }

  return message
}

export const useStaticConfigFileList = (serviceCode: string, serviceName: string, dictionary: ConfigFilesDictionary) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [items, setItems] = useState<StaticConfigFileItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Request body contract for POST {serviceCode}/api/json-static-files/search:
  // { page_size, page_index, search_text }. Backend page_index starts at 0, so the 1-based
  // UI page is converted with page_index = page - 1. Never swap page_size/page_index.
  const request = useMemo(() => ({
    page_size: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE,
    page_index: Math.max(0, page - 1),
    search_text: searchText
  }), [page, pageSize, searchText])

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = await configFileService.searchStaticConfigFiles(serviceCode, request)
      const result = normalizeSearchResult(payload, pageSize)

      setItems(result.items)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setPage(result.pageIndex + 1)
      setPageSize(result.pageSize || pageSize)
    } catch (caught) {
      setError(toErrorMessage(
        caught,
        dictionary,
        configFileText(dictionary, 'config_files_list_load_failed', 'Unable to load {service} config files.').replace('{service}', serviceName)
      ))
      setItems([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [dictionary, pageSize, request, serviceCode, serviceName])

  useEffect(() => {
    void loadFiles()
  }, [loadFiles, refreshKey])

  const submitSearch = () => {
    setPage(1)
    setSearchText(searchInput.trim())
  }

  const resetSearch = () => {
    setSearchInput('')
    setSearchText('')
    setPage(1)
    setRefreshKey(value => value + 1)
  }

  return {
    error,
    items,
    loadFiles,
    loading,
    page,
    pageSize,
    resetSearch,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    submitSearch,
    totalCount,
    totalPages
  }
}
