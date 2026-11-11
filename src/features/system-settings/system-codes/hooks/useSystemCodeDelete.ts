'use client'

import { useState } from 'react'
import Swal from 'sweetalert2'

import type { Locale } from '@/configs/i18n'
import SwalAlert, { escapeHtml } from '@/shared/utils/SwalAlert'

import { systemCodeText } from '../components/systemCodeHelpers'
import { systemCodeService } from '../services/systemCodeService'
import type { SystemCodeItem, SystemCodesDictionary } from '../types'
import { SystemCodeApiError } from '../types'

export const useSystemCodeDelete = ({
  dictionary,
  language,
  item,
  onDeleted
}: {
  dictionary: SystemCodesDictionary
  language: Locale
  item: SystemCodeItem | null
  onDeleted: () => Promise<void>
}) => {
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!item || deleting || item.id <= 0) return false

    const result = await Swal.fire({
      title: systemCodeText(dictionary, 'delete_confirm_title', 'Xóa mã hệ thống?'),
      html: `<div style="text-align:left; line-height:1.6;">${escapeHtml(systemCodeText(dictionary, 'delete_confirm_message', 'Bạn có chắc chắn muốn xóa mã "{code_id}" thuộc danh mục "{code_name}" không?'))
        .replace('{code_id}', `<strong>${escapeHtml(item.code_id)}</strong>`)
        .replace('{code_name}', `<strong>${escapeHtml(item.code_name)}</strong>`)}</div>`,
      icon: 'warning',
      position: 'center',
      color: 'black',
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: systemCodeText(dictionary, 'delete_button', 'Xóa'),
      cancelButtonText: systemCodeText(dictionary, 'cancel_button', 'Hủy'),
      confirmButtonColor: '#d32f2f'
    })
    if (!result.isConfirmed) return false

    setDeleting(true)
    try {
      await systemCodeService.deleteSystemCode({ language, id: item.id })
      SwalAlert('success', systemCodeText(dictionary, 'delete_success', 'Xóa mã hệ thống thành công'), 'center')
      await onDeleted()
      return true
    } catch (error) {
      if (error instanceof SystemCodeApiError && error.nextAction === 'logout') window.location.assign(`/${language}/logout`)
      SwalAlert('error', error instanceof Error ? error.message : systemCodeText(dictionary, 'delete_failed', 'Không thể xóa mã hệ thống.'), 'center')
      return false
    } finally {
      setDeleting(false)
    }
  }

  return { deleting, confirmDelete }
}
