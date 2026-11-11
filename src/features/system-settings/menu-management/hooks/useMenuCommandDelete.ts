'use client'

import { useState } from 'react'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import Swal from 'sweetalert2'

import type { Locale } from '@/configs/i18n'
import SwalAlert, { escapeHtml } from '@/shared/utils/SwalAlert'

import { commonText, getMenuCommandDisplayName, menuManagementText, toMenuManagementPath } from '../components/menuCommandHelpers'
import { menuCommandService } from '../services/menuCommandService'
import type { MenuCommandItem, MenuManagementDictionary } from '../types'

type Params = {
  dictionary: MenuManagementDictionary
  sessiontoken?: string
  locale: Locale
  item: MenuCommandItem | null
}

export const useMenuCommandDelete = ({ dictionary, sessiontoken, locale, item }: Params) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!item || deleting) return

    const isMenu = item.command_type === 'M'
    const displayName = getMenuCommandDisplayName(item, locale)
    const typeWord = isMenu
      ? menuManagementText(dictionary, 'delete_type_menu_word', 'Menu')
      : menuManagementText(dictionary, 'delete_type_command_word', 'chức năng')

    const html = `
      <div style="text-align:left; font-size:14px; line-height:1.6;">
        <p style="margin:0 0 10px 0;">
          ${escapeHtml(menuManagementText(dictionary, 'delete_confirm_question_prefix', 'Bạn có chắc chắn muốn xóa'))}
          ${escapeHtml(typeWord)} "<strong>${escapeHtml(displayName)}</strong>" (${escapeHtml(item.command_id)})?
        </p>
        <p style="margin:0${isMenu ? ' 0 10px 0' : ''}; color:#b91c1c; font-weight:600;">
          ${escapeHtml(menuManagementText(dictionary, 'delete_confirm_irreversible', 'Thao tác này không thể hoàn tác.'))}
        </p>
        ${isMenu
          ? `<p style="margin:0; font-size:12.5px; color:#6b7280;">${escapeHtml(menuManagementText(dictionary, 'delete_menu_children_warning', 'Nếu menu này đang có menu con hoặc chức năng trực thuộc, hệ thống có thể không cho phép xóa.'))}</p>`
          : ''}
      </div>
    `

    // Plain sweetalert2 Swal.fire (not the SwalAlert wrapper) for the confirm step itself —
    // same pattern used by every other delete-from-detail-page flow in this codebase (see
    // useAssetDetail.ts / useVendorDetail.ts). The SwalAlert wrapper is used afterwards for the
    // success/error result, matching the rest of the app's convention.
    const result = await Swal.fire({
      title: menuManagementText(dictionary, 'delete_confirm_title', 'Xác nhận xóa Menu / Tính năng'),
      html,
      icon: 'warning',
      position: 'center',
      color: 'black',
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: commonText(dictionary, 'delete', 'Xóa'),
      cancelButtonText: commonText(dictionary, 'cancel', 'Hủy'),
      confirmButtonColor: '#d32f2f'
    })

    if (!result.isConfirmed) return

    setDeleting(true)

    try {
      await menuCommandService.deleteUserCommand({ sessiontoken, language: locale, commandId: item.command_id })

      SwalAlert(
        'success',
        menuManagementText(dictionary, 'delete_success_message', 'Menu / Tính năng đã được xóa khỏi hệ thống.'),
        'center',
        true,
        false,
        false,
        undefined,
        'OK',
        { title: menuManagementText(dictionary, 'delete_success_title', 'Xóa thành công') }
      )

      // Return to the exact list state (search_text/page_index/page_size) the user came from —
      // carried onto this page's URL by MenuManagementContent's row navigation — and force a
      // fresh server fetch so the deleted row is actually gone from the list, not just missing
      // from a stale client cache.
      router.push(toMenuManagementPath(locale, searchParams.toString()))
      router.refresh()
    } catch (caught) {
      SwalAlert(
        'error',
        caught instanceof Error ? caught : menuManagementText(dictionary, 'delete_failed', 'Không thể xóa Menu / Tính năng.'),
        'center',
        true,
        false,
        false,
        undefined,
        'OK',
        { title: menuManagementText(dictionary, 'delete_error_title', 'Không thể xóa Menu / Tính năng.') }
      )
    } finally {
      setDeleting(false)
    }
  }

  return { deleting, confirmDelete }
}
