'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import { getWorkflowErrorPresentation } from '@/shared/utils/workflowError'

import { userRoleService } from '../services/userRoleService'
import type { UserRoleCreateRequest, UserRoleWorkflowErrorInfo } from '../types'

export type UserRoleCreateForm = Omit<UserRoleCreateRequest, 'role_type'>

const emptyForm: UserRoleCreateForm = {
  role_name: '',
  service_id: '',
  role_description: ''
}

export const useUserRoleCreate = ({
  locale,
  messages
}: {
  locale: Locale
  messages: {
    roleNameRequired: string
    serviceRequired: string
    createFailed: string
  }
}) => {
  const { data: session } = useSession()
  const [form, setForm] = useState<UserRoleCreateForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [workflowError, setWorkflowError] = useState<UserRoleWorkflowErrorInfo | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserRoleCreateForm, string>>>({})

  const updateField = <K extends keyof UserRoleCreateForm>(key: K, value: UserRoleCreateForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  // Dung rieng cho nut "Tiep theo" o buoc 1 (Thong tin quyen): chi validate + hien loi field, chua goi API tao role.
  // Tra ve form da trim khi hop le (dung lai cho submit()), hoac null khi con field bat buoc bi thieu.
  const validate = (): UserRoleCreateForm | null => {
    const nextForm: UserRoleCreateForm = {
      role_name: form.role_name.trim(),
      service_id: form.service_id.trim(),
      role_description: form.role_description.trim()
    }
    const nextErrors: Partial<Record<keyof UserRoleCreateForm, string>> = {}

    if (!nextForm.role_name) nextErrors.role_name = messages.roleNameRequired
    if (!nextForm.service_id) nextErrors.service_id = messages.serviceRequired

    setForm(nextForm)
    setFieldErrors(nextErrors)

    return Object.keys(nextErrors).length === 0 ? nextForm : null
  }

  const submit = async (): Promise<{ success: boolean; roleId: number | null }> => {
    if (saving) return { success: false, roleId: null }

    const validForm = validate()
    if (!validForm) return { success: false, roleId: null }

    setSaving(true)
    setWorkflowError(null)

    try {
      const sessiontoken = session?.user?.token ?? undefined

      const { role } = await userRoleService.createUserRole({ sessiontoken, language: locale, fields: validForm })
      setForm(emptyForm)
      setFieldErrors({})
      return { success: true, roleId: role && role.role_id > 0 ? role.role_id : null }
    } catch (error) {
      const presentation = getWorkflowErrorPresentation(error, messages.createFailed)

      setWorkflowError({
        message: presentation.message,
        workflowStep: presentation.workflowStep,
        executionId: presentation.executionId,
        technicalDetails: presentation.technicalDetails
      })
      return { success: false, roleId: null }
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    saving,
    workflowError,
    fieldErrors,
    updateField,
    validate,
    submit
  }
}
