'use client'

import { useMemo, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import {
  buildCreateFeeTypeFormValues,
  buildFeeTypeFormValues,
  feeText,
  feeTypeStatusOptions
} from '../components/feeTypeHelpers'
import {
  buildFeeTypeCreatePayload,
  buildFeeTypeUpdatePayload,
  mapFeeTypeBackendErrorMessages,
  mapFeeTypeBackendFieldErrors
} from '../components/feeTypePayloadHelpers'
import { feeTypeHref, LEGACY_FEE_TYPE_ROUTES, type FeeTypeRouteConfig } from '../feeTypeRoutes'
import { feeService } from '../service'
import { useFeeTypeCalculationMethodCodeList } from './useFeeTypeCalculationMethodCodeList'
import { useFeeTypeGroupCodeList } from './useFeeTypeGroupCodeList'
import type {
  CreateFeeTypeRequest,
  FeeDictionary,
  FeeTypeFormValues,
  FeeTypeItem,
  UpdateFeeTypeRequest
} from '../types'

type FieldErrors = Partial<Record<keyof FeeTypeFormValues, string>>

type Params = {
  dictionary: FeeDictionary
  locale: string
  sessiontoken?: string
  language?: any
  mode: 'create' | 'edit'
  detail?: FeeTypeItem | null
  routes?: FeeTypeRouteConfig
}

export function useFeeTypeForm({
  dictionary,
  locale,
  sessiontoken,
  language,
  mode,
  detail = null,
  routes = LEGACY_FEE_TYPE_ROUTES
}: Params) {
  const router = useRouter()
  const [values, setValues] = useState<FeeTypeFormValues>(() => {
    if (mode === 'edit' && detail) {
      return buildFeeTypeFormValues(detail)
    }

    return buildCreateFeeTypeFormValues()
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const isEditMode = mode === 'edit'
  const calculationMethods = useFeeTypeCalculationMethodCodeList(locale, values.calculation_method)
  const feeTypeGroups = useFeeTypeGroupCodeList(locale, values.group_type)

  const statusOptions = useMemo(() => {
    const options = [...feeTypeStatusOptions]

    if (values.status && !options.includes(values.status as typeof feeTypeStatusOptions[number])) {
      return [values.status, ...options]
    }

    return options
  }, [values.status])

  const updateValue = <K extends keyof FeeTypeFormValues>(key: K, value: FeeTypeFormValues[K]) => {
    if (key === 'default_amount') {
      const normalized = String(value ?? '').replace(',', '.')

      if (!/^\d*(\.\d*)?$/.test(normalized)) {
        return
      }

      setValues(current => ({ ...current, [key]: normalized as FeeTypeFormValues[K] }))
      setErrors(current => ({ ...current, [key]: undefined }))

      return
    }

    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const nextErrors: FieldErrors = {}

    if (!values.fee_type_code.trim()) nextErrors.fee_type_code = feeText(dictionary, 'fee_type_code_required', 'Fee type code is required.')
    if (!values.name.trim()) nextErrors.name = feeText(dictionary, 'fee_type_name_required', 'Fee type name is required.')
    if (!values.calculation_method.trim()) nextErrors.calculation_method = feeText(dictionary, 'calculation_method_required', 'Calculation method is required.')
    if (isEditMode && !values.status.trim()) nextErrors.status = feeText(dictionary, 'status_required', 'Status is required.')
    if (values.default_amount && Number.isNaN(Number(values.default_amount))) {
      nextErrors.default_amount = feeText(dictionary, 'default_amount_invalid', 'Default amount must be a valid number.')
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => {
    router.push(isEditMode && detail?.id ? feeTypeHref(locale, routes, `/${detail.id}`) : feeTypeHref(locale, routes))
  }

  const submit = async () => {
    if (!validate()) return

    setSaving(true)

    try {
      if (isEditMode) {
        if (!detail?.id) return

        const payload: UpdateFeeTypeRequest = buildFeeTypeUpdatePayload(values, detail.id)

        await feeService.updateFeeType({
          sessiontoken,
          language,
          fields: payload
        })

        SwalAlert('success', feeText(dictionary, 'fee_type_update_success', 'Fee type updated successfully.'), 'center')
        router.push(feeTypeHref(locale, routes, `/${detail.id}`))
      } else {
        const payload: CreateFeeTypeRequest = buildFeeTypeCreatePayload(values)

        const response = await feeService.createFeeType({
          sessiontoken,
          language,
          fields: payload
        })

        SwalAlert('success', feeText(dictionary, 'fee_type_create_success', 'Fee type created successfully.'), 'center')
        router.push(response.id ? feeTypeHref(locale, routes, `/${response.id}`) : feeTypeHref(locale, routes))
      }

      router.refresh()
    } catch (error) {
      const fallback = feeText(
        dictionary,
        isEditMode ? 'fee_type_update_failed' : 'fee_type_create_failed',
        isEditMode ? 'Unable to update fee type.' : 'Unable to create fee type.'
      )
      const workflowError = normalizeWorkflowErrorDetail(error, { fallback })
      const errorLabels = {
        name: feeText(dictionary, 'field_fee_type_name', 'Fee Type Name'),
        fee_type_code: feeText(dictionary, 'field_fee_type_code', 'Fee Type Code'),
        nameRequired: feeText(dictionary, 'fee_type_name_required', 'Fee type name is required.')
      }
      const fieldErrors = mapFeeTypeBackendFieldErrors(workflowError.errors ?? [], errorLabels)
      const messages = mapFeeTypeBackendErrorMessages(workflowError.errors ?? [], errorLabels)

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(current => ({ ...current, ...fieldErrors }))
      }

      const message = messages.length > 0 ? messages.join('\n') : workflowError.message
      const errorReference = workflowError.executionId
        ? `\n${dictionary.common?.errorReference ?? dictionary.common?.executionid ?? 'Error Reference'}: ${workflowError.executionId}`
        : ''

      SwalAlert('error', `${message}${errorReference}`, 'center')
    } finally {
      setSaving(false)
    }
  }

  return {
    values,
    errors,
    saving,
    isEditMode,
    calculationMethodOptions: calculationMethods.options,
    calculationMethodLoading: calculationMethods.isLoading,
    calculationMethodError: calculationMethods.error,
    calculationMethodErrorExecutionId: calculationMethods.executionId,
    groupTypeOptions: feeTypeGroups.options,
    groupTypeLoading: feeTypeGroups.isLoading,
    groupTypeError: feeTypeGroups.error,
    statusOptions,
    updateValue,
    goBack,
    submit
  }
}
