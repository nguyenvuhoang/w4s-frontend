'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'
import { getWorkflowErrorPresentation } from '@/shared/utils/workflowError'

import { userRoleService } from '../services/userRoleService'
import type { UserRoleItem, UserRoleUpdateRequest, UserRoleWorkflowErrorInfo } from '../types'
import { toUserRolesPath } from '../components/userRoleHelpers'

export type UserRoleEditForm = Omit<UserRoleUpdateRequest, 'role_id' | 'sort_order'> & {
  sort_order: number | ''
}

const toEditForm = (role: UserRoleItem): UserRoleEditForm => ({
  role_name: role.role_name ?? '',
  role_description: role.role_description ?? '',
  role_type: role.role_type ?? '',
  service_id: String(role.service_id ?? ''),
  status: role.status ?? '',
  is_show: role.is_show === 'Y' ? 'Y' : 'N',
  sort_order: role.sort_order ?? 0
})

export const useUserRoleDetail = ({
  role: initialRole,
  initialError,
  locale,
  messages
}: {
  role: UserRoleItem | null
  initialError?: UserRoleWorkflowErrorInfo | null
  locale: Locale
  messages: {
    roleNameRequired: string
    roleTypeRequired: string
    serviceRequired: string
    statusRequired: string
    updateFailed: string
    deleteTitle: string
    deleteConfirm: string
    deleteConfirmButton: string
    deleteCancelButton: string
    deleteSuccess: string
    deleteFailed: string
  }
}) => {
  const { data: session } = useSession()
  const router = useRouter()
  const [role, setRole] = useState(initialRole)
  const [editForm, setEditForm] = useState<UserRoleEditForm | null>(initialRole ? toEditForm(initialRole) : null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [workflowError, setWorkflowError] = useState<UserRoleWorkflowErrorInfo | null>(initialError ?? null)
  const [errorContext, setErrorContext] = useState<'load' | 'update' | 'delete'>('load')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserRoleEditForm, string>>>({})

  useEffect(() => {
    setRole(initialRole)
    setEditForm(initialRole ? toEditForm(initialRole) : null)
    setEditMode(false)
    setWorkflowError(initialError ?? null)
    setErrorContext('load')
    setFieldErrors({})
  }, [initialError, initialRole])

  const startEdit = () => {
    if (!role) return
    setEditForm(toEditForm(role))
    setWorkflowError(null)
    setFieldErrors({})
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditForm(role ? toEditForm(role) : null)
    setFieldErrors({})
    setWorkflowError(null)
    setEditMode(false)
  }

  const updateField = <K extends keyof UserRoleEditForm>(key: K, value: UserRoleEditForm[K]) => {
    setEditForm(current => current ? ({ ...current, [key]: value } as UserRoleEditForm) : current)
    setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  const save = async () => {
    if (!role || !editForm || saving) return false

    const nextForm = {
      ...editForm,
      role_name: editForm.role_name.trim(),
      role_description: editForm.role_description.trim(),
      role_type: editForm.role_type.trim(),
      service_id: editForm.service_id.trim(),
      status: editForm.status.trim()
    }
    const nextErrors: Partial<Record<keyof UserRoleEditForm, string>> = {}

    if (!nextForm.role_name) nextErrors.role_name = messages.roleNameRequired
    if (!nextForm.role_type) nextErrors.role_type = messages.roleTypeRequired
    if (!nextForm.service_id) nextErrors.service_id = messages.serviceRequired
    if (!nextForm.status) nextErrors.status = messages.statusRequired
    const sortOrderValue = Number(nextForm.sort_order)
    const sortOrder = Number.isFinite(sortOrderValue) ? sortOrderValue : 0

    if (Object.keys(nextErrors).length > 0) {
      setEditForm(nextForm)
      setFieldErrors(nextErrors)
      return false
    }

    setSaving(true)
    setWorkflowError(null)
    setErrorContext('update')

    try {
      const fields: UserRoleUpdateRequest = { ...nextForm, role_id: role.role_id, sort_order: sortOrder }
      const sessiontoken = session?.user?.token ?? undefined

      await userRoleService.updateUserRoleProfile({ sessiontoken, language: locale, fields })
      const response = await userRoleService.getUserRoleById({ sessiontoken, language: locale, roleId: role.role_id })

      if (!response.role) throw new Error(messages.updateFailed)

      setRole(response.role)
      setEditForm(toEditForm(response.role))
      setEditMode(false)
      return true
    } catch (error) {
      const presentation = getWorkflowErrorPresentation(error, messages.updateFailed)

      setWorkflowError({
        message: presentation.message,
        workflowStep: presentation.workflowStep,
        executionId: presentation.executionId,
        technicalDetails: presentation.technicalDetails
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const reload = async () => {
    if (!role) return false

    try {
      const sessiontoken = session?.user?.token ?? undefined
      const response = await userRoleService.getUserRoleById({ sessiontoken, language: locale, roleId: role.role_id })

      if (!response.role) throw new Error(messages.updateFailed)

      setRole(response.role)
      setEditForm(toEditForm(response.role))
      return true
    } catch (error) {
      const presentation = getWorkflowErrorPresentation(error, messages.updateFailed)

      setWorkflowError({
        message: presentation.message,
        workflowStep: presentation.workflowStep,
        executionId: presentation.executionId,
        technicalDetails: presentation.technicalDetails
      })
      return false
    }
  }

  const deleteRole = async () => {
    if (!role || deleting) return

    const result = await Swal.fire({
      title: messages.deleteTitle,
      text: messages.deleteConfirm,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: messages.deleteConfirmButton,
      cancelButtonText: messages.deleteCancelButton
    })

    if (!result.isConfirmed) return

    setDeleting(true)
    setWorkflowError(null)
    setErrorContext('delete')

    try {
      const sessiontoken = session?.user?.token ?? undefined

      await userRoleService.deleteUserRole({ sessiontoken, language: locale, roleId: role.role_id })

      SwalAlert('success', messages.deleteSuccess, 'top-end')
      router.push(toUserRolesPath(locale))
      router.refresh()
    } catch (error) {
      const presentation = getWorkflowErrorPresentation(error, messages.deleteFailed)

      setWorkflowError({
        message: presentation.message,
        workflowStep: presentation.workflowStep,
        executionId: presentation.executionId,
        technicalDetails: presentation.technicalDetails
      })
    } finally {
      setDeleting(false)
    }
  }

  return {
    role,
    editForm,
    editMode,
    saving,
    deleting,
    workflowError,
    errorContext,
    fieldErrors,
    startEdit,
    cancelEdit,
    updateField,
    save,
    reload,
    deleteRole
  }
}
