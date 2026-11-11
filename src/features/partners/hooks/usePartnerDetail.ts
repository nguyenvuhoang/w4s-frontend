import { useRef, useState } from 'react'

import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { normalizePartnerStatus, partnerText, validatePartnerValues } from '../partnerHelpers'
import { partnerService } from '../service'
import type { PartnerDictionary, PartnerFormValues, PartnerItem, PartnerWorkflowError } from '../types'

type FieldErrors = Partial<Record<keyof PartnerFormValues, string>>

type Params = {
  dictionary: PartnerDictionary
  sessiontoken?: string
  language: Parameters<typeof partnerService.getPartnerById>[0]['language']
  partner: PartnerItem | null
  initialError?: PartnerWorkflowError | null
}

const toFormValues = (partner: PartnerItem): PartnerFormValues => ({
  partner_name: partner.partner_name,
  contact_name: partner.contact_name,
  phone: partner.phone,
  email: partner.email,
  address: partner.address,
  status: normalizePartnerStatus(partner.status) === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
})

export const usePartnerDetail = ({ dictionary, sessiontoken, language, partner: initialPartner, initialError = null }: Params) => {
  const [partner, setPartner] = useState(initialPartner)
  const [error, setError] = useState<PartnerWorkflowError | null>(initialError)
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<PartnerFormValues>(() => initialPartner ? toFormValues(initialPartner) : { partner_name: '', contact_name: '', phone: '', email: '', address: '', status: 'ACTIVE' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)

  const updateValue = <K extends keyof PartnerFormValues>(key: K, value: PartnerFormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }))
    setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  const startEdit = () => {
    if (!partner) return
    setValues(toFormValues(partner))
    setFieldErrors({})
    setError(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    if (partner) setValues(toFormValues(partner))
    setFieldErrors({})
    setEditing(false)
  }

  const validate = () => {
    const nextErrors: FieldErrors = validatePartnerValues(dictionary, values)

    setFieldErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const save = async () => {
    if (!partner || !validate()) return
    const id = Number(partner.id)

    if (!Number.isInteger(id) || id <= 0) {
      setError({ message: partnerText(dictionary, 'detail_not_found', 'Partner detail was not found.') })

      return
    }

    setSaving(true)
    setError(null)
    try {
      await partnerService.updatePartner({
        sessiontoken,
        language,
        fields: {
          id,
          partner_name: values.partner_name.trim(),
          contact_name: values.contact_name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          address: values.address.trim(),
          status: values.status
        }
      })
      const refreshedPartner = await partnerService.getPartnerById({ sessiontoken, language, id })

      setPartner(refreshedPartner)
      setEditing(false)
      SwalAlert('success', partnerText(dictionary, 'update_success', 'Partner updated successfully.'), 'center')
    } catch (caught) {
      const detail = normalizeWorkflowErrorDetail(caught, { fallback: partnerText(dictionary, 'update_failed', 'Unable to update partner.') })

      setError({ message: detail.message, executionId: detail.executionId })
    } finally {
      setSaving(false)
    }
  }

  /** Calls WF_BO_DELETE_PARTNER for the partner being viewed. Resolves true only after backend success. */
  const remove = async () => {
    const id = Number(partner?.id)

    if (!partner || deletingRef.current || !Number.isInteger(id) || id <= 0) return false

    deletingRef.current = true
    setDeleting(true)
    try {
      await partnerService.deletePartner({ sessiontoken, language, id })

      return true
    } catch (caught) {
      const detail = normalizeWorkflowErrorDetail(caught, { fallback: partnerText(dictionary, 'delete_failed', 'Unable to delete partner.') })

      SwalAlert('error', detail.executionId ? `ExecutionId: ${detail.executionId}: ${detail.message}` : detail.message, 'center')

      return false
    } finally {
      deletingRef.current = false
      setDeleting(false)
    }
  }

  return { partner, error, editing, values, fieldErrors, saving, deleting, updateValue, startEdit, cancelEdit, save, remove }
}
