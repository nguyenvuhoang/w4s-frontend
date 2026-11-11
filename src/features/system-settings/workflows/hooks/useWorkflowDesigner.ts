import { useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { workflowService } from '../services/workflowService'
import type { WorkflowDefinition, WorkflowStepItem } from '../types'
import { WorkflowApiError } from '../types'

type WorkflowDesignerData = {
  definition: WorkflowDefinition | null
  steps: WorkflowStepItem[]
  loading: boolean
  error: { message: string; executionId?: string } | null
}

export const useWorkflowDesigner = (locale: Locale, workflowId: string): WorkflowDesignerData => {
  const [state, setState] = useState<WorkflowDesignerData>({ definition: null, steps: [], loading: true, error: null })

  useEffect(() => {
    let active = true
    const load = async () => {
      setState(current => ({ ...current, loading: true, error: null }))
      try {
        const [searchResult, steps] = await Promise.all([
          workflowService.searchWorkflows({ language: locale, filter: { search_text: workflowId, channel_id: '', page_index: 0, page_size: 100 } }),
          workflowService.getWorkflowSteps({ language: locale, workflowId })
        ])
        if (!active) return
        setState({ definition: searchResult.items.find(item => item.def.workflow_id === workflowId)?.def ?? null, steps, loading: false, error: null })
      } catch (caught) {
        if (!active) return
        setState({ definition: null, steps: [], loading: false, error: { message: caught instanceof Error ? caught.message : 'Unable to load workflow designer.', executionId: caught instanceof WorkflowApiError ? caught.executionId : undefined } })
      }
    }
    void load()
    return () => { active = false }
  }, [locale, workflowId])

  return state
}
