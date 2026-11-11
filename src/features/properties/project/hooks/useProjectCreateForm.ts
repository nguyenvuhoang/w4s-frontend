'use client'

import { useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'
import type { getDictionary } from '@/shared/utils/getDictionary'

import { ProjectLogoUploadError, propertyAggregateService } from '../../propertyAggregateService'
import { EMPTY_PROJECT_BANK_ACCOUNT, type ProjectBankAccount, type ProjectBankAccountGroup } from '../bank/projectBankTypes'
import { projectLogoUploadErrorMessage, useProjectLogoFile } from '../logo/useProjectLogoFile'
import { PROJECT_MANAGEMENT_BASE_PATH } from '../projectListHelpers'
import { toHandoverDatePayload } from '../projectDateHelpers'
import type { ProjectCreatePayload } from '../../types'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export type ProjectCreateFormValues = {
  project_name: string
  project_code: string
  province: string
  investor: string
  address: string
  description: string
  /** Date input value (YYYY-MM-DD) or ''. */
  handover_date: string
  /** Optional receiving accounts (no required rule confirmed by Backend); Backend field names. */
  operating_bank_account: ProjectBankAccount
  deposit_bank_account: ProjectBankAccount
}

type FieldErrors = Partial<Record<Exclude<keyof ProjectCreateFormValues, ProjectBankAccountGroup>, string>>

const emptyValues: ProjectCreateFormValues = {
  project_name: '',
  project_code: '',
  // Picked from the Province master lookup (no pre-filled hard-coded province).
  province: '',
  investor: '',
  address: '',
  description: '',
  handover_date: '',
  operating_bank_account: EMPTY_PROJECT_BANK_ACCOUNT,
  deposit_bank_account: EMPTY_PROJECT_BANK_ACCOUNT
}

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.projectManagement?.[key] ?? fallback

export const normalizeProjectCode = (value: string) => value.toUpperCase().replace(/\s+/g, '_')

export function useProjectCreateForm({
  dictionary,
  locale,
  sessiontoken,
  basePath = PROJECT_MANAGEMENT_BASE_PATH
}: {
  dictionary: Dictionary
  locale: string
  sessiontoken?: string
  /** Project catalog area the form belongs to: back / success go to its list or detail. */
  basePath?: string
}) {
  const router = useRouter()
  const [values, setValues] = useState<ProjectCreateFormValues>(emptyValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const logo = useProjectLogoFile(dictionary)

  const updateValue = <K extends Exclude<keyof ProjectCreateFormValues, ProjectBankAccountGroup>>(key: K, value: ProjectCreateFormValues[K]) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const updateBankAccount = (group: ProjectBankAccountGroup, field: keyof ProjectBankAccount, value: string) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [group]: { ...current[group], [field]: value } }))
  }

  const validate = () => {
    const nextErrors: FieldErrors = {}

    if (!values.project_name.trim()) nextErrors.project_name = text(dictionary, 'projectNameRequired', 'Project Name is required.')
    if (!values.project_code.trim()) nextErrors.project_code = text(dictionary, 'projectCodeRequired', 'Project Code is required.')
    if (!values.province.trim()) nextErrors.province = text(dictionary, 'provinceRequired', 'Province/City is required.')
    if (values.description.length > 500) nextErrors.description = text(dictionary, 'descriptionMax', 'Description must not exceed 500 characters.')

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => {
    router.push(`/${locale}${basePath}`)
  }

  const submit = async () => {
    if (saving) return
    if (!validate()) return

    setSaving(true)
    setSubmitError(null)

    try {
      // logo_url is filled by create_project_with_logo from the real upload response.
      const payload: Omit<ProjectCreatePayload, 'logo_url'> = {
        name: values.project_name.trim(),
        province: values.province,
        address: values.address.trim(),
        investor: values.investor.trim(),
        project_code: values.project_code.trim(),
        description: values.description.trim(),
        handover_date: toHandoverDatePayload(values.handover_date),
        // Mapped to the Backend objects (trimmed, account_number kept as a string) by the service.
        operating_bank_account: values.operating_bank_account,
        deposit_bank_account: values.deposit_bank_account
      }

      const created = await propertyAggregateService.create_project_with_logo({
        sessiontoken,
        language: locale as Locale,
        payload,
        logo_file: logo.file
      })

      SwalAlert('success', text(dictionary, 'createProjectSuccess', 'Project created successfully.'), 'center')
      router.push(created?.id ? `/${locale}${basePath}/${created.id}` : `/${locale}${basePath}`)
      router.refresh()
    } catch (error) {
      const message = error instanceof ProjectLogoUploadError
        ? projectLogoUploadErrorMessage(dictionary, error)
        : error instanceof Error
          ? error.message
          : text(dictionary, 'createProjectFailed', 'Unable to create project.')

      setSubmitError(message)
      SwalAlert('error', message, 'center')
    } finally {
      setSaving(false)
    }
  }

  return {
    values,
    errors,
    submitError,
    saving,
    logo,
    updateValue,
    updateBankAccount,
    goBack,
    submit
  }
}
