'use client'

import { useState } from 'react'

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import type { RowActionConfig } from '@/shared/components/table/RowActionMenu'
import SwalAlert from '@/shared/utils/SwalAlert'

import { userRoleService } from '../services/userRoleService'
import type { UserRoleItem, UserRolesDictionary } from '../types'
import { userRoleText } from '../components/userRoleHelpers'

type Params = {
  dictionary: UserRolesDictionary
  locale: Locale
  /** Resolved once, centrally, from the current user's menu/permission tree — never per row. */
  canModify: boolean
  canDelete: boolean
  onNavigateToDetail: (row: UserRoleItem) => void
  onDeleted: () => void | Promise<void>
}

/**
 * Row action config for the User Roles list — reuses exactly the Modify/Delete capabilities that
 * already exist on the role detail page (same workflow, same confirm copy, same permission keys),
 * just exposed one click earlier from the list's "..." menu.
 */
export const useUserRoleRowActions = ({ dictionary, locale, canModify, canDelete, onNavigateToDetail, onDeleted }: Params) => {
  const { data: session } = useSession()
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null)

  const handleDelete = async (row: UserRoleItem) => {
    setDeletingRoleId(row.role_id)

    try {
      const sessiontoken = session?.user?.token ?? undefined

      await userRoleService.deleteUserRole({ sessiontoken, language: locale, roleId: row.role_id })
      SwalAlert('success', userRoleText(dictionary, 'role_delete_success', 'Role deleted successfully.'), 'top-end')
      await onDeleted()
    } catch (error) {
      SwalAlert('error', error)
    } finally {
      setDeletingRoleId(null)
    }
  }

  const getRowActions = (row: UserRoleItem): RowActionConfig<UserRoleItem>[] => [
    {
      key: 'edit',
      label: userRoleText(dictionary, 'modify', 'Modify'),
      icon: <EditOutlinedIcon fontSize="small" />,
      permission: canModify,
      visibleWhen: item => item.role_id > 0,
      onClick: onNavigateToDetail
    },
    {
      key: 'delete',
      label: userRoleText(dictionary, 'delete', 'Delete'),
      icon: <DeleteOutlineIcon fontSize="small" />,
      color: 'error',
      permission: canDelete,
      visibleWhen: item => item.role_id > 0,
      disabledWhen: item => deletingRoleId === item.role_id,
      confirm: {
        title: userRoleText(dictionary, 'delete_role_title', 'Delete Role'),
        text: userRoleText(dictionary, 'delete_role_confirm', 'Are you sure you want to delete this role?'),
        confirmButtonText: userRoleText(dictionary, 'delete', 'Delete'),
        cancelButtonText: userRoleText(dictionary, 'cancel', 'Cancel'),
        icon: 'warning'
      },
      onClick: handleDelete
    }
  ]

  return { getRowActions }
}
