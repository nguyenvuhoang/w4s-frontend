import { useCallback, useEffect, useRef, useState } from 'react'

import { useWorkingProjectId } from '@/@core/stores/useWorkingProjectStore'
import { WorkflowError } from '@/shared/utils/workflowError'

import { promotionText } from '../components/promotionHelpers'
import { promotionService } from '../service'
import type { PromotionDictionary, PromotionItem, PromotionWorkflowError } from '../types'

type Params = {
  dictionary: PromotionDictionary
  sessiontoken?: string
  language?: any
  id: number | string
  initialPromotion: PromotionItem | null
  initialError?: PromotionWorkflowError | null
}

const toPromotionError = (
  dictionary: PromotionDictionary,
  error: unknown
): PromotionWorkflowError => {
  if (error instanceof WorkflowError) {
    return {
      message: error.message || promotionText(dictionary, 'detail_load_failed', 'Unable to load promotion detail.'),
      executionId: error.execution_id || undefined
    }
  }

  return {
    message: error instanceof Error
      ? error.message
      : promotionText(dictionary, 'detail_load_failed', 'Unable to load promotion detail.')
  }
}

/**
 * There is no WF_BO_GET_PROMOTION_BY_ID workflow yet. The server route already tries a
 * project-scoped lookup (reusing the search workflow) when the URL carries a project_id query
 * param. If that wasn't available at SSR time (e.g. a bookmarked/shared link without the query
 * param), this hook retries once client-side using the resolved working project id.
 */
export function usePromotionDetail({
  dictionary,
  sessiontoken,
  language,
  id,
  initialPromotion,
  initialError = null
}: Params) {
  const workingProjectId = useWorkingProjectId()
  const [promotion, setPromotion] = useState(initialPromotion)
  const [error, setError] = useState<PromotionWorkflowError | null>(initialError)
  const [loading, setLoading] = useState(false)
  const hasAttemptedFallbackRef = useRef(false)

  const fetchFallbackDetail = useCallback(async () => {
    if (!sessiontoken || !workingProjectId) return

    setLoading(true)

    try {
      const result = await promotionService.getPromotionById({ sessiontoken, language, projectId: workingProjectId, id })

      setPromotion(result)
    } catch (err) {
      setError(toPromotionError(dictionary, err))
    } finally {
      setLoading(false)
    }
  }, [dictionary, id, language, sessiontoken, workingProjectId])

  useEffect(() => {
    if (promotion || error) return
    if (!sessiontoken || !workingProjectId || !id) return
    if (hasAttemptedFallbackRef.current) return

    hasAttemptedFallbackRef.current = true
    void fetchFallbackDetail()
  }, [promotion, error, sessiontoken, workingProjectId, id, fetchFallbackDetail])

  return { promotion, error, loading }
}
