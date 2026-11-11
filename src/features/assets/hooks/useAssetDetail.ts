'use client'

import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'
import Swal from 'sweetalert2'

import SwalAlert from '@/shared/utils/SwalAlert'

import { assetText, commonText } from '../components/assetHelpers'
import { assetService } from '../services/assetService'
import type { AssetDictionary, AssetItem } from '../types'

type Params = {
  dictionary: AssetDictionary
  locale: string
  sessiontoken?: string
  asset: AssetItem | null
  initialError?: string | null
}

export function useAssetDetail({ dictionary, locale, sessiontoken, asset, initialError = null }: Params) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const goBack = () => {
    router.push(`/${locale}/assets/assets`)
  }

  const deleteAsset = async () => {
    if (!asset?.id || deleting) return

    const assetLabel = asset.asset_code || asset.name
    const assetLabelName = asset.asset_code
      ? assetText(dictionary, 'field_asset_code', 'Asset Code')
      : assetText(dictionary, 'field_name', 'Name')
    const result = await Swal.fire({
      title: assetText(dictionary, 'delete_asset_title', 'Delete Asset'),
      text: assetLabel
        ? `${assetText(dictionary, 'delete_asset_confirm', 'Are you sure you want to delete this asset?')}\n\n${assetLabelName}: ${assetLabel}`
        : assetText(dictionary, 'delete_asset_confirm', 'Are you sure you want to delete this asset?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: commonText(dictionary, 'delete', 'Delete'),
      cancelButtonText: commonText(dictionary, 'cancel', 'Cancel')
    })

    if (!result.isConfirmed) return

    setDeleting(true)

    try {
      await assetService.deleteAsset({
        sessiontoken,
        language: locale as any,
        fields: {
          id: asset.id
        }
      })

      SwalAlert('success', assetText(dictionary, 'asset_delete_success', 'Asset deleted successfully.'), 'center')
      router.push(`/${locale}/assets/assets`)
      router.refresh()
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : assetText(dictionary, 'asset_delete_failed', 'Unable to delete asset.')

      SwalAlert('error', message, 'center')
    } finally {
      setDeleting(false)
    }
  }

  return {
    asset,
    error: initialError,
    deleting,
    goBack,
    deleteAsset
  }
}
