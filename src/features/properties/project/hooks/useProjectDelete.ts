import { useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { propertyAggregateService } from '../../propertyAggregateService'

/**
 * Delete flow: confirm dialog -> WF_BO_DELETE_PROJECT { id } -> onDeleted only after the backend succeeded.
 * Cancel never calls the workflow; a failure (e.g. the project is still referenced) stays inside the dialog,
 * the detail page is kept and nothing is retried. A ref guard blocks double-submit before React re-renders.
 */
export function useProjectDelete({
  projectId,
  sessiontoken,
  language,
  fallbackError,
  onDeleted
}: {
  projectId: number
  sessiontoken?: string
  language: Locale
  fallbackError: string
  onDeleted: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const requestDelete = () => {
    setError(null)
    setOpen(true)
  }

  const cancel = () => {
    if (inFlight.current) return
    setOpen(false)
    setError(null)
  }

  const confirm = async () => {
    if (!projectId || inFlight.current) return

    inFlight.current = true
    setDeleting(true)
    setError(null)

    try {
      await propertyAggregateService.delete_project_detail({ sessiontoken, language, id: projectId })
      setOpen(false)
      await onDeleted()
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : fallbackError)
    } finally {
      inFlight.current = false
      setDeleting(false)
    }
  }

  return { open, deleting, error, requestDelete, cancel, confirm }
}
