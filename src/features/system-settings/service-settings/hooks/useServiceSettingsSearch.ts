'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ServiceSettingItem, ServiceSettingsDictionary } from '../types'
import { SERVICE_SETTINGS_SERVICES, type ServiceSettingsService, ServiceSettingsApiError, serviceSettingsService } from '../services/serviceSettingsService'

const PAGE_SIZE = 10
const stringValue = (value: unknown) => typeof value === 'string' ? value : ''

const normalizeItem = (item: any): ServiceSettingItem => ({
  id: item?.id ?? null,
  organizationId: item?.organization_id ?? item?.organizationId ?? null,
  name:stringValue(item?.name ?? item?.key ?? item?.setting_name ?? item?.settingName),
  value: item?.value ?? item?.setting_value ?? item?.settingValue,
  organization: stringValue(item?.organization ?? item?.organization_name ?? item?.organizationName)
})

const getText = (dictionary: ServiceSettingsDictionary, key: string, fallback: string) => dictionary.system_settings_modules?.[key] ?? fallback

export const useServiceSettingsSearch = (dictionary: ServiceSettingsDictionary) => {
  const [service, setService] = useState<ServiceSettingsService>(SERVICE_SETTINGS_SERVICES[0])
  const [searchInput, setSearchInput] = useState('')
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [items, setItems] = useState<ServiceSettingItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await serviceSettingsService.search(service)
      const data = payload?.data ?? payload ?? {}
      const nextItems = Array.isArray(data.items) ? data.items.map(normalizeItem).filter((item: ServiceSettingItem) => item.name) : []

      setItems(nextItems)
      setTotalCount(nextItems.length)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : getText(dictionary, 'service_settings_load_failed', 'Unable to load service settings.')
      const reference = caught instanceof ServiceSettingsApiError ? caught.executionId : undefined
      const serviceMessage = `${service}: ${message}`
      setError(reference ? `${serviceMessage} ${getText(dictionary, 'service_settings_error_reference_label', 'Error Reference')}: ${reference}` : serviceMessage)
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [dictionary, service])

  useEffect(() => { void load() }, [load, refreshKey])

  return {
    error,
    items: useMemo(() => {
      const normalizedName = name.toLowerCase()
      const filteredItems = normalizedName ? items.filter(item => item.name.toLowerCase().includes(normalizedName)) : items
      const start = (page - 1) * pageSize
      return filteredItems.slice(start, start + pageSize)
    }, [items, name, page, pageSize]),
    loading, page, pageSize, searchInput, service,
    totalCount: name ? items.filter(item => item.name.toLowerCase().includes(name.toLowerCase())).length : totalCount,
    setPage, setPageSize, setSearchInput,
    setService: (nextService: ServiceSettingsService) => { setService(nextService); setPage(1) },
    submitSearch: () => { setPage(1); setName(searchInput.trim()) },
    refresh: () => setRefreshKey(value => value + 1),
    // Optimistically reflect a saved value before the backend refresh completes. Paging and the
    // applied name filter are untouched, so the user stays on the same page.
    updateItemValue: (target: ServiceSettingItem, value: string) => setItems(current => current.map(item =>
      (target.id !== null && target.id !== undefined ? item.id === target.id : item.name === target.name) ? { ...item, value } : item
    ))
  }
}
