import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { floorText } from '../floorHelpers'
import { floorService } from '../floorService'
import type { FloorDictionary } from '../types'

/**
 * Delete flow: confirm -> WF_BO_DELETE_FLOOR { id } -> onDeleted (reload/navigate) only after the
 * Backend succeeded. On a workflow error the dialog stays open with the error and the record is kept.
 */
export function useFloorDelete({
  dictionary,
  sessiontoken,
  language,
  onDeleted
}: {
  dictionary: FloorDictionary
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
      await floorService.deleteFloor({ sessiontoken, language, id: targetId })
      setTargetId(null)
      await onDeleted()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : floorText(dictionary, 'deleteFloorFailed', 'Unable to delete floor.'))
    } finally {
      setDeleting(false)
    }
  }

  return { open: targetId !== null, deleting, error, requestDelete, cancel, confirm }
}
