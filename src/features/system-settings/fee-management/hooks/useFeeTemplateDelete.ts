'use client'

import { useRef, useState } from 'react'

import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { FEE_TEMPLATE_DELETE_WORKFLOW_ID, feeTemplateService, type FeeTemplateItem } from '../feeTemplate.service'
import { feeSettingsText } from '../feeSettingsModules'

type Params = {
  dictionary: SystemSettingsDictionary
  sessiontoken?: string
  language?: any
  onDeleted: () => void
}

/**
 * Delete a notification template from its detail page (WF_BO_DELETE_NOTIFICATION_TEMPLATE) after a
 * SwalAlert confirmation. "Template in use" and other rules come from the backend and are shown as
 * is (with the execution id); nothing related is removed on the client.
 */
export function useFeeTemplateDelete({ dictionary, sessiontoken, language, onDeleted }: Params) {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const [deleting, setDeleting] = useState(false)
  const busyRef = useRef(false)

  const runDelete = async (id: number) => {
    if (busyRef.current) return

    busyRef.current = true
    setDeleting(true)

    try {
      await feeTemplateService.remove({ sessiontoken, language, id })
      SwalAlert('success', text('template_delete_success', 'Template deleted.'), 'center')
      onDeleted()
    } catch (deleteError) {
      const detail = normalizeWorkflowErrorDetail(deleteError, {
        fallback: text('template_delete_failed', 'Unable to delete the template.'),
        workflowId: FEE_TEMPLATE_DELETE_WORKFLOW_ID
      })
      const reference = detail.executionId ? `\n${text('error_reference', 'Error reference')}: ${detail.executionId}` : ''

      SwalAlert('error', `${detail.message}${reference}`, 'center')
    } finally {
      busyRef.current = false
      setDeleting(false)
    }
  }

  const deleteTemplate = (template: Pick<FeeTemplateItem, 'id' | 'template_code'>) => {
    if (!template.id || busyRef.current) return

    const id = template.id

    SwalAlert(
      'warning',
      text('template_delete_confirm', 'Delete template {code}? This action cannot be undone.').replace('{code}', template.template_code || `#${id}`),
      'center',
      false,
      true,
      true,
      () => void runDelete(id),
      text('delete', 'Delete'),
      { title: text('template_delete_title', 'Delete template'), cancelButtonText: text('cancel', 'Cancel') }
    )
  }

  return { deleteTemplate, deleting }
}
