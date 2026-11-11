'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { feeService } from '../../service'
import type { FeePeriodItem, FeeProjectOption } from '../../types'

export function useFeeImportPickers({ sessiontoken, language, projectId }: { sessiontoken?: string; language: Locale | string; projectId: number | null }) {
  const [projects, setProjects] = useState<FeeProjectOption[]>([])
  const [periods, setPeriods] = useState<FeePeriodItem[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadProjects = useCallback(async () => {
    if (!sessiontoken) return
    setProjectsLoading(true)
    try {
      setProjects(await feeService.simpleSearchProjects({ sessiontoken, language: language as Locale, page_size: 100 }))
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load projects.'))
    } finally {
      setProjectsLoading(false)
    }
  }, [language, sessiontoken])

  const loadPeriods = useCallback(async () => {
    if (!sessiontoken || !projectId) {
      setPeriods([])
      return
    }
    setPeriodsLoading(true)
    try {
      const response = await feeService.searchFeePeriods({
        sessiontoken,
        language: language as Locale,
        filter: { search_text: '', project_id: projectId, year: null, month: null, status: '', page_index: 1, page_size: 100 }
      })
      setPeriods(response.items.filter(period => Boolean(period.id)))
    } catch (cause) {
      setPeriods([])
      setError(cause instanceof Error ? cause : new Error('Unable to load fee periods.'))
    } finally {
      setPeriodsLoading(false)
    }
  }, [language, projectId, sessiontoken])

  useEffect(() => { void loadProjects() }, [loadProjects])
  useEffect(() => { void loadPeriods() }, [loadPeriods])

  return useMemo(() => ({ projects, periods, projectsLoading, periodsLoading, error, reloadProjects: loadProjects, reloadPeriods: loadPeriods }), [error, loadPeriods, loadProjects, periods, periodsLoading, projects, projectsLoading])
}
