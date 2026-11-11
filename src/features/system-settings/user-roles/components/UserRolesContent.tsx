'use client'

import AddIcon from '@mui/icons-material/Add'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { Alert, Breadcrumbs, Button, Link as MuiLink, Paper, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import { useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import { resolveRowInteractionMode } from '@/shared/components/table'
import RowInteractionTip from '@/shared/components/table/RowInteractionTip'
import { useAppContext } from '@/shared/contexts/AppContext'
import { hasEffectiveScreenActionAccess } from '@/shared/utils/authorization'

import { useUserRoleRowActions } from '../hooks/useUserRoleRowActions'
import { useUserRoleSearch } from '../hooks/useUserRoleSearch'
import type { UserRoleFilterModel, UserRolesPageProps, UserRoleSearchResponse } from '../types'
import { commonText, toUserRoleCreatePath, toUserRoleDetailPath, userRoleText } from './userRoleHelpers'
import UserRolesFilterBar from './UserRolesFilterBar'
import UserRolesTable from './UserRolesTable'

type Props = UserRolesPageProps & {
  initialFilter: UserRoleFilterModel
  initialData: UserRoleSearchResponse
  initialError?: string | null
}

const UserRolesContent = ({ dictionary, session, locale, initialFilter, initialData, initialError }: Props) => {
  const router = useRouter()
  const isSuperAdmin = useWorkingProjectIsSuperAdmin()
  const { menuData } = useAppContext()
  const canCreate = hasEffectiveScreenActionAccess({
    userCommand: menuData,
    route: '/system-settings/user-roles',
    action: 'ADD',
    isSuperAdmin
  })
  // Same permission keys the role detail page already gates Modify/Delete on — resolved once
  // here, centrally, from the user's menu tree, and reused for every row in the list.
  const canModify = hasEffectiveScreenActionAccess({
    userCommand: menuData,
    route: '/system-settings/user-roles',
    action: 'MODIFY',
    isSuperAdmin
  })
  const canDelete = hasEffectiveScreenActionAccess({
    userCommand: menuData,
    route: '/system-settings/user-roles',
    action: 'DELETE',
    isSuperAdmin
  })
  const userRoles = useUserRoleSearch({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })
  const rowActions = useUserRoleRowActions({
    dictionary,
    locale,
    canModify,
    canDelete,
    onNavigateToDetail: row => router.push(toUserRoleDetailPath(locale, row.role_id)),
    onDeleted: async () => { await userRoles.loadData() }
  })

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={1.5}>
          <Stack spacing={1}>
            <Breadcrumbs sx={{ mb: 1 }}>
              <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline="hover">
                {userRoleText(dictionary, 'breadcrumb_system_settings', 'System Settings')}
              </MuiLink>
              <Typography color="text.primary">
                {userRoleText(dictionary, 'breadcrumb_user_roles', 'Role Management')}
              </Typography>
            </Breadcrumbs>

            <Stack direction="row" gap={1.5} alignItems="flex-start">
              <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
              <Stack>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {userRoleText(dictionary, 'list_title', 'Role Management')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userRoleText(dictionary, 'list_subtitle', 'Search and manage Back Office roles and permissions.')}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {canCreate && (
            <Button
              component={NextLink}
              href={toUserRoleCreatePath(locale)}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', md: 'flex-start' } }}
            >
              {userRoleText(dictionary, 'add_role', 'Add Role')}
            </Button>
          )}
        </Stack>

        <UserRolesFilterBar
          dictionary={dictionary}
          filter={userRoles.draftFilter}
          loading={userRoles.loading}
          onChange={userRoles.updateDraftFilter}
          onSearch={userRoles.handleSearch}
          onReset={userRoles.handleReset}
        />

        {userRoles.error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void userRoles.loadData()}>
                {commonText(dictionary, 'retry', 'Retry')}
              </Button>
            }
          >
            {userRoles.error}
          </Alert>
        )}

        <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

        <UserRolesTable
          dictionary={dictionary}
          rows={userRoles.rows}
          loading={userRoles.loading}
          pageIndex={userRoles.filter.page_index}
          pageSize={userRoles.filter.page_size}
          onOpenDetail={row => router.push(toUserRoleDetailPath(locale, row.role_id))}
          rowActions={rowActions.getRowActions}
        />

        {userRoles.totalCount > 0 && (
          <PaginationPage
            page={userRoles.filter.page_index}
            pageSize={userRoles.filter.page_size}
            totalResults={userRoles.totalCount}
            jumpPage={userRoles.filter.page_index}
            handlePageSizeChange={userRoles.handlePageSizeChange}
            handlePageChange={userRoles.handlePageChange}
            handleJumpPage={userRoles.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </Paper>
  )
}

export default UserRolesContent
