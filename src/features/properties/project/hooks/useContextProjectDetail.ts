'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { propertyAggregateService } from '../../propertyAggregateService'
import type { ProjectDetailModel } from '../../types'
import { projectText, type ProjectDictionary } from '../projectListHelpers'

/**
 * Detail of the working-project context (the id comes from the header project context, never from a
 * search result): WF_BO_GET_PROJECT_DETAIL through the existing service. The context lives in the
 * browser (per user), so this is loaded on the client once the project is known.
 */
export function useContextProjectDetail({
  dictionary,
  sessiontoken,
  language,
  projectId
}: {
  dictionary: ProjectDictionary
  sessiontoken?: string
  language: Locale
  projectId: number | null
}) {
  const [project, setProject] = useState<ProjectDetailModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const detail = await propertyAggregateService.get_project_detail({ sessiontoken, language, project_id: projectId })

      if (signal?.cancelled) return
      setProject(detail)
      if (!detail) setError(projectText(dictionary, 'projectNotFound', 'Project not found.'))
    } catch (caught) {
      if (signal?.cancelled) return
      setProject(null)
      setError(caught instanceof Error ? caught.message : projectText(dictionary, 'loadError', 'Unable to load data.'))
    } finally {
      if (!signal?.cancelled) setLoading(false)
    }
  }, [dictionary, language, projectId, sessiontoken])

  // Reload whenever the working project changes in the header.
  useEffect(() => {
    const signal = { cancelled: false }

    void Promise.resolve().then(() => load(signal))

    return () => { signal.cancelled = true }
  }, [load])

  return { project, loading, error, reload: () => void load() }
}
