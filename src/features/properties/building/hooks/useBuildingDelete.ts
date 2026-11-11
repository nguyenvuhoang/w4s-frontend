import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { buildingText } from '../buildingHelpers'
import { buildingService } from '../buildingService'
import type { BuildingDictionary } from '../types'

/**
 * Delete flow: confirm -> WF_BO_DELETE_BUILDING { id } -> onDeleted (navigate/reload) only after the
 * Backend succeeded. A business error (e.g. the tower still has floors/apartments) stays in the dialog
 * and the record is kept.
 */
export function useBuildingDelete({
  dictionary,
  sessiontoken,
  language,
  onDeleted
}: {
  dictionary: BuildingDictionary
  sessiontoken?: string
  language: Locale
  onDeleted: () => void | Promise<void>
}) {
  const [targetId, setTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestDelete = (id: number) => {
    setError(null)
    setTargetId(id)
  }

  const cancel = () => {
    if (deleting) return
    setTargetId(null)
    setError(null)
  }

  const confirm = async () => {
    if (!targetId || deleting) return

    setDeleting(true)
    setError(null)

    try {
      await buildingService.deleteBuilding({ sessiontoken, language, id: targetId })
      setTargetId(null)
      await onDeleted()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : buildingText(dictionary, 'deleteBuildingFailed', 'Unable to delete tower.'))
    } finally {
      setDeleting(false)
    }
  }

  return { open: targetId !== null, deleting, error, requestDelete, cancel, confirm }
}
