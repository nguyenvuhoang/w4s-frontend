import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { apartmentText } from '../apartmentHelpers'
import { apartmentSearchService } from '../services/apartmentSearchService'
import type { ApartmentDictionary } from '../types'

/**
 * Delete flow: confirm -> WF_BO_DELETE_APARTMENT { id } -> onDeleted (notify + navigate) only after the
 * Backend succeeded. On a workflow error the dialog stays open with the error and the record is kept.
 */
export function useApartmentDelete({
  dictionary,
  sessiontoken,
  language,
  onDeleted
}: {
  dictionary: ApartmentDictionary
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
      await apartmentSearchService.deleteApartment({ sessiontoken, language, id: targetId })
      setTargetId(null)
      await onDeleted()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : apartmentText(dictionary, 'deleteApartmentFailed', 'Unable to delete apartment.'))
    } finally {
      setDeleting(false)
    }
  }

  return { open: targetId !== null, deleting, error, requestDelete, cancel, confirm }
}
