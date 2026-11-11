'use client'

import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'
import Swal from 'sweetalert2'

import SwalAlert from '@/shared/utils/SwalAlert'

import { commonText, feeText } from '../components/feeTypeHelpers'
import { feeTypeHref, LEGACY_FEE_TYPE_ROUTES, type FeeTypeRouteConfig } from '../feeTypeRoutes'
import { feeService } from '../service'
import type { FeeDictionary, FeeTypeItem } from '../types'

type Params = {
  dictionary: FeeDictionary
  locale: string
  sessiontoken?: string
  initialDetail: FeeTypeItem | null
  initialError?: string | null
  routes?: FeeTypeRouteConfig
}

export function useFeeTypeDetail({
  dictionary,
  locale,
  sessiontoken,
  initialDetail,
  initialError = null,
  routes = LEGACY_FEE_TYPE_ROUTES
}: Params) {
  const router = useRouter()
  const [detail] = useState<FeeTypeItem | null>(initialDetail)
  const [error] = useState<string | null>(initialError)
  const [deleting, setDeleting] = useState(false)

  const goBack = () => {
    router.push(feeTypeHref(locale, routes))
  }

  const deleteFeeType = async () => {
    if (!detail?.id || deleting) return

    const result = await Swal.fire({
      title: feeText(dictionary, 'delete_fee_type_title', 'Delete Fee Type'),
      text: detail.name
        ? `${feeText(dictionary, 'deleteConfirm', 'Are you sure you want to delete this fee type?')}\n\n${feeText(dictionary, 'field_fee_type_name', 'Fee Type Name')}: ${detail.name}`
        : feeText(dictionary, 'deleteConfirm', 'Are you sure you want to delete this fee type?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: commonText(dictionary, 'delete', 'Delete'),
      cancelButtonText: commonText(dictionary, 'cancel', 'Cancel')
    })

    if (!result.isConfirmed) return

    setDeleting(true)

    try {
      await feeService.deleteFeeType({
        sessiontoken,
        language: locale as any,
        fields: {
          id: detail.id
        }
      })

      SwalAlert('success', feeText(dictionary, 'fee_type_delete_success', 'Fee type deleted successfully.'), 'center')
      router.push(feeTypeHref(locale, routes))
      router.refresh()
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : feeText(dictionary, 'fee_type_delete_failed', 'Unable to delete fee type.')

      SwalAlert('error', message, 'center')
    } finally {
      setDeleting(false)
    }
  }

  return {
    dictionary,
    detail,
    error,
    deleting,
    goBack,
    deleteFeeType
  }
}
