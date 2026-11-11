import { useRef, useState } from 'react'

import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { partnerText, validatePartnerValues } from '../partnerHelpers'
import { partnerService } from '../service'
import type { PartnerCreateFormValues, PartnerDictionary, PartnerWorkflowError } from '../types'

type Params = {
  dictionary: PartnerDictionary
  sessiontoken?: string
  language: Parameters<typeof partnerService.createPartner>[0]['language']
  /** Called after a successful create once the dialog closes, to reload the list from the backend. */
  onCreated: () => void
}

const emptyCreateForm: PartnerCreateFormValues = { partner_code: '', partner_name: '', contact_name: '', phone: '', email: '', address: '' }

export function usePartnerCreate({ dictionary, sessiontoken, language, onCreated }: Params) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<PartnerCreateFormValues>(emptyCreateForm)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PartnerCreateFormValues, string>>>({})
  const [error, setError] = useState<PartnerWorkflowError | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Locks the form after success until the dialog closes, so Save cannot create a duplicate.
  const [created, setCreated] = useState(false)
  const submittingRef = useRef(false)

  const openCreate = () => {
    setValues(emptyCreateForm)
    setFieldErrors({})
    setError(null)
    setCreated(false)
    setOpen(true)
  }

  const finish = () => {
    setOpen(false)
    onCreated()
  }

  const close = () => {
    if (submittingRef.current) return
    if (created) finish()
    else setOpen(false)
  }

  const updateValue = <K extends keyof PartnerCreateFormValues>(key: K, value: PartnerCreateFormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }))
    setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  const submit = async () => {
    if (submittingRef.current || created) return

    const nextErrors = validatePartnerValues(dictionary, values, { requireCode: true })

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      await partnerService.createPartner({ sessiontoken, language, fields: values })
      setCreated(true)
      SwalAlert('success', partnerText(dictionary, 'create_success', 'Partner created successfully.'), 'center', false, false, true, finish)
    } catch (caught) {
      const detail = normalizeWorkflowErrorDetail(caught, { fallback: partnerText(dictionary, 'create_failed', 'Unable to create partner.') })

      setError({ message: detail.message, executionId: detail.executionId })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return { open, values, fieldErrors, error, submitting, created, openCreate, close, updateValue, submit }
}
