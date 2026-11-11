import { useCallback, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { workflowService } from '../services/workflowService'
import type { WorkflowsDictionary, WorkflowStepsCacheEntry } from '../types'
import { WorkflowApiError } from '../types'
import { commonText, workflowText } from '../components/workflowHelpers'

type Params = {
  dictionary: WorkflowsDictionary
  language: Locale
}

const IDLE_ENTRY: WorkflowStepsCacheEntry = { status: 'idle', steps: [] }

export const useWorkflowStepsCache = ({ dictionary, language }: Params) => {
  const [cache, setCache] = useState<Record<string, WorkflowStepsCacheEntry>>({})
  const requestVersionRef = useRef<Record<string, number>>({})

  const getEntry = useCallback((workflowId: string): WorkflowStepsCacheEntry => (
    cache[workflowId] ?? IDLE_ENTRY
  ), [cache])

  const fetchSteps = useCallback(async (workflowId: string) => {
    const requestVersion = (requestVersionRef.current[workflowId] ?? 0) + 1

    requestVersionRef.current[workflowId] = requestVersion

    setCache(current => ({
      ...current,
      [workflowId]: { status: 'loading', steps: current[workflowId]?.steps ?? [] }
    }))

    try {
      const steps = await workflowService.getWorkflowSteps({ language, workflowId })

      if (requestVersionRef.current[workflowId] !== requestVersion) return

      setCache(current => ({ ...current, [workflowId]: { status: 'loaded', steps } }))
    } catch (caught) {
      if (requestVersionRef.current[workflowId] !== requestVersion) return

      const message = caught instanceof WorkflowApiError && caught.executionId
        ? `${caught.message} ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${caught.executionId}`
        : caught instanceof Error
          ? caught.message
          : workflowText(dictionary, 'steps_load_failed', 'Unable to load processing steps.')

      setCache(current => ({ ...current, [workflowId]: { status: 'error', steps: [], errorMessage: message } }))
    }
  }, [dictionary, language])

  const ensureLoaded = useCallback((workflowId: string) => {
    const entry = cache[workflowId]

    if (!entry || entry.status === 'idle') {
      void fetchSteps(workflowId)
    }
  }, [cache, fetchSteps])

  return { getEntry, fetchSteps, ensureLoaded }
}
