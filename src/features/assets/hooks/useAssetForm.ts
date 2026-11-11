'use client'

import { useMemo, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import SwalAlert from '@/shared/utils/SwalAlert'

import {
  assetCategoryOptions,
  assetStatusOptions,
  assetText,
  buildCreateAssetFormValues,
  buildAssetFormValues,
  toAssetIsoDate
} from '../components/assetHelpers'
import { assetService } from '../services/assetService'
import type {
  AssetDictionary,
  AssetFormValues,
  AssetItem,
  AssetProjectOption,
  CreateAssetRequest,
  UpdateAssetRequest
} from '../types'

type FieldErrors = Partial<Record<keyof AssetFormValues, string>>

type Params = {
  dictionary: AssetDictionary
  locale: string
  sessiontoken?: string
  language?: any
  mode: 'create' | 'edit'
  asset?: AssetItem | null
  projectOptions?: AssetProjectOption[]
}

export function useAssetForm({
  dictionary,
  locale,
  sessiontoken,
  language,
  mode,
  asset = null,
  projectOptions = []
}: Params) {
  const router = useRouter()
  const [values, setValues] = useState<AssetFormValues>(() => {
    if (mode === 'edit' && asset) return buildAssetFormValues(asset)

    return buildCreateAssetFormValues(projectOptions[0]?.id)
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEditMode = mode === 'edit'

  const categoryOptions = useMemo(() => {
    const options = [...assetCategoryOptions]

    if (values.category && !options.includes(values.category as typeof assetCategoryOptions[number])) {
      return [values.category, ...options]
    }

    return options
  }, [values.category])

  const statusOptions = useMemo(() => {
    const options = [...assetStatusOptions]

    if (values.status && !options.includes(values.status as typeof assetStatusOptions[number])) {
      return [values.status, ...options]
    }

    return options
  }, [values.status])

  const updateValue = <K extends keyof AssetFormValues>(key: K, value: AssetFormValues[K]) => {
    setSubmitError(null)

    if (key === 'purchase_value') {
      const normalized = String(value ?? '').replace(',', '.')

      if (!/^\d*(\.\d*)?$/.test(normalized)) return

      setValues(current => ({ ...current, [key]: normalized as AssetFormValues[K] }))
      setErrors(current => ({ ...current, [key]: undefined }))

      return
    }

    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const nextErrors: FieldErrors = {}

    if (!isEditMode && (!Number.isFinite(Number(values.project_id)) || Number(values.project_id) <= 0)) {
      nextErrors.project_id = assetText(dictionary, 'project_required', 'Project is required.')
    }
    if (!values.asset_code.trim()) nextErrors.asset_code = assetText(dictionary, 'asset_code_required', 'Asset code is required.')
    if (!values.name.trim()) nextErrors.name = assetText(dictionary, 'asset_name_required', 'Asset name is required.')
    if (!values.category.trim()) nextErrors.category = assetText(dictionary, 'category_required', 'Category is required.')
    if (isEditMode && !values.status.trim()) nextErrors.status = assetText(dictionary, 'status_required', 'Status is required.')
    if (values.purchase_value && Number.isNaN(Number(values.purchase_value))) {
      nextErrors.purchase_value = assetText(dictionary, 'purchase_value_invalid', 'Purchase value must be a valid number.')
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => {
    router.push(isEditMode && asset?.id ? `/${locale}/assets/assets/${asset.id}` : `/${locale}/assets/assets`)
  }

  const submit = async () => {
    if (!validate()) return

    setSaving(true)
    setSubmitError(null)

    try {
      const basePayload = {
        location: values.location.trim(),
        category: values.category.trim(),
        description: values.description.trim(),
        name: values.name.trim(),
        asset_code: values.asset_code.trim(),
        purchase_value: values.purchase_value.trim() === '' ? '' : Number(values.purchase_value),
        purchase_date: toAssetIsoDate(values.purchase_date),
        qr_code: values.qr_code.trim()
      }

      if (isEditMode) {
        if (!asset?.id) return

        const payload: UpdateAssetRequest = {
          id: asset.id,
          location: basePayload.location,
          category: basePayload.category,
          description: basePayload.description,
          name: basePayload.name,
          asset_code: basePayload.asset_code,
          status: values.status.trim(),
          purchase_value: basePayload.purchase_value,
          purchase_date: basePayload.purchase_date,
          qr_code: basePayload.qr_code
        }

        await assetService.updateAsset({
          sessiontoken,
          language,
          fields: payload
        })

        SwalAlert('success', assetText(dictionary, 'asset_update_success', 'Asset updated successfully.'), 'center')
        router.push(`/${locale}/assets/assets/${asset.id}`)
      } else {
        const payload: CreateAssetRequest = {
          description: basePayload.description,
          location: basePayload.location,
          project_id: Number(values.project_id),
          name: basePayload.name,
          asset_code: basePayload.asset_code,
          purchase_value: basePayload.purchase_value,
          purchase_date: basePayload.purchase_date,
          qr_code: basePayload.qr_code,
          category: basePayload.category
        }

        const response = await assetService.createAsset({
          sessiontoken,
          language,
          fields: payload
        })

        SwalAlert('success', assetText(dictionary, 'asset_create_success', 'Asset created successfully.'), 'center')
        router.push(response.id ? `/${locale}/assets/assets/${response.id}` : `/${locale}/assets/assets`)
      }

      router.refresh()
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : assetText(
          dictionary,
          isEditMode ? 'asset_update_failed' : 'asset_create_failed',
          isEditMode ? 'Unable to update asset.' : 'Unable to create asset.'
        )

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
    isEditMode,
    categoryOptions,
    statusOptions,
    updateValue,
    goBack,
    submit
  }
}
