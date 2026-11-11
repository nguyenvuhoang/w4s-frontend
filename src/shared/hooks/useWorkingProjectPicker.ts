'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import {
  useWorkingProject,
  useWorkingProjectErrorReference,
  useWorkingProjectList,
  useWorkingProjectRetrying,
  useWorkingProjectStatus,
  useWorkingProjectStore,
  useWorkingProjectWasInvalidated,
  type WorkingProjectOption
} from '@/@core/stores/useWorkingProjectStore'

const PAGE_SIZE = 12

const headerText = (dictionary: any, key: string, fallback: string) => dictionary?.header?.[key] ?? fallback

type Params = {
  dictionary?: any
  sessiontoken?: string
  language?: Locale | string
}

/**
 * The picker list is sourced entirely from the projects the current user was authorized for
 * by WF_BO_GET_BO_CONTEXT (useWorkingProjectStore.projects) — it must never call a
 * general-purpose project search, otherwise a project outside the authorized list could be
 * shown/selected. Search and pagination below are purely client-side filters over that list.
 */
export function useWorkingProjectPicker({ dictionary, sessiontoken, language }: Params) {
  const workingProject = useWorkingProject()
  const status = useWorkingProjectStatus()
  const authorizedProjects = useWorkingProjectList()
  const wasProjectInvalidated = useWorkingProjectWasInvalidated()
  const errorReference = useWorkingProjectErrorReference()
  const retrying = useWorkingProjectRetrying()

  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [pageIndex, setPageIndex] = useState(0)

  // Auto-boot only — if the context already resolved (by another consumer mounted earlier,
  // e.g. DashboardContent), do NOT re-fetch just because this hook mounts later (a fresh
  // mount of SelectProjectScreen after navigating there, for instance). An explicit re-fetch
  // is only ever triggered by handleRetry below.
  useEffect(() => {
    if (!sessiontoken) return
    if (useWorkingProjectStore.getState().status !== 'LOADING') return

    void useWorkingProjectStore.getState().initialize({ sessiontoken, language })
  }, [sessiontoken, language])

  const filteredProjects = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()

    if (!keyword) return authorizedProjects

    return authorizedProjects.filter(project =>
      project.code.toLowerCase().includes(keyword) || project.name.toLowerCase().includes(keyword)
    )
  }, [authorizedProjects, searchText])

  const totalCount = filteredProjects.length
  const items = filteredProjects.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE)

  const openPicker = useCallback(() => {
    setOpen(true)
    setSearchText('')
    setPageIndex(0)
  }, [])

  const closePicker = useCallback(() => setOpen(false), [])

  const handleSearchSubmit = useCallback(() => {
    setPageIndex(0)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPageIndex(Math.max(page - 1, 0))
  }, [])

  const handleRetry = useCallback(() => {
    void useWorkingProjectStore.getState().initialize({ sessiontoken, language })
  }, [sessiontoken, language])

  const handleSelect = useCallback(async (project: WorkingProjectOption) => {
    await useWorkingProjectStore.getState().setProject(project)
    setOpen(false)
  }, [])

  const errorMessage = status === 'ERROR'
    ? headerText(dictionary, 'working_project_load_failed', 'Unable to load projects.')
    : null

  return {
    workingProject,
    status,
    wasProjectInvalidated,
    open,
    items,
    loading: status === 'LOADING',
    error: errorMessage,
    errorReference: status === 'ERROR' || status === 'SERVICE_UNAVAILABLE' ? errorReference : null,
    retrying,
    searchText,
    pageIndex,
    totalCount,
    pageSize: PAGE_SIZE,
    setSearchText,
    openPicker,
    closePicker,
    handleSearchSubmit,
    handlePageChange,
    handleRetry,
    handleSelect
  }
}
