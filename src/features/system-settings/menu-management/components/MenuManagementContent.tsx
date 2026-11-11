'use client'

import AddRounded from '@mui/icons-material/AddRounded'
import SchemaRounded from '@mui/icons-material/SchemaRounded'
import { Alert, Breadcrumbs, Button, Link as MuiLink, Paper, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import PaginationPage from '@/@core/components/jTable/pagination'
import { resolveRowInteractionMode, RowInteractionTip } from '@/shared/components/table'
import { useAppContext } from '@/shared/contexts/AppContext'
import { hasEffectiveScreenActionAccess } from '@/shared/utils/authorization'

import { useMenuCommandSearch } from '../hooks/useMenuCommandSearch'
import type { MenuCommandFilterModel, MenuCommandSearchResponse, MenuManagementPageProps } from '../types'
import {
  buildMenuCommandQueryString,
  commonText,
  menuManagementText,
  toMenuCommandCreatePath,
  toMenuCommandDetailPath
} from './menuCommandHelpers'
import MenuManagementFilterBar from './MenuManagementFilterBar'
import MenuManagementTable from './MenuManagementTable'

const MENU_MANAGEMENT_ROUTE = '/system-settings/menu-management'

type Props = MenuManagementPageProps & {
  initialFilter: MenuCommandFilterModel
  initialData: MenuCommandSearchResponse
  initialError?: string | null
}

const MenuManagementContent = ({ dictionary, session, locale, initialFilter, initialData, initialError }: Props) => {
  const isSuperAdmin = useWorkingProjectIsSuperAdmin()
  const { menuData } = useAppContext()
  const canCreate = hasEffectiveScreenActionAccess({ userCommand: menuData, route: MENU_MANAGEMENT_ROUTE, action: 'ADD', isSuperAdmin })
  const menuCommands = useMenuCommandSearch({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={1.5}>
          <Stack spacing={1}>
            <Breadcrumbs sx={{ mb: 1 }}>
              <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline="hover">
                {menuManagementText(dictionary, 'breadcrumb_system_settings', 'Thiết lập hệ thống')}
              </MuiLink>
              <Typography color="text.primary">
                {menuManagementText(dictionary, 'list_title', 'Quản lý Menu')}
              </Typography>
            </Breadcrumbs>

            <Stack direction="row" gap={1.5} alignItems="flex-start">
              <SchemaRounded color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
              <Stack>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {menuManagementText(dictionary, 'list_title', 'Quản lý Menu')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {menuManagementText(
                    dictionary,
                    'list_subtitle',
                    'Quản lý menu, tính năng và các command/action được sử dụng trong hệ thống.'
                  )}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {canCreate && (
            <Button
              component={NextLink}
              href={toMenuCommandCreatePath(locale)}
              variant="contained"
              startIcon={<AddRounded />}
              sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', md: 'flex-start' } }}
            >
              {menuManagementText(dictionary, 'add_new', 'Thêm mới')}
            </Button>
          )}
        </Stack>

        <MenuManagementFilterBar
          dictionary={dictionary}
          searchText={menuCommands.draftSearchText}
          typeFilter={menuCommands.typeFilter}
          loading={menuCommands.loading}
          onSearchTextChange={menuCommands.updateDraftSearchText}
          onSearchKeyDown={menuCommands.handleSearchKeyDown}
          onSearch={menuCommands.handleSearch}
          onRefresh={menuCommands.handleRefresh}
          onTypeFilterChange={menuCommands.setTypeFilter}
        />

        {menuCommands.error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void menuCommands.loadData()}>
                {commonText(dictionary, 'retry', 'Thử lại')}
              </Button>
            }
          >
            {menuCommands.error}
          </Alert>
        )}

        <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

        <MenuManagementTable
          dictionary={dictionary}
          locale={locale}
          rows={menuCommands.filteredRows}
          loading={menuCommands.loading}
          pageSize={menuCommands.filter.page_size}
          onOpenDetail={row => {
            // Detail opens in a new tab so the list (its search/page state, its scroll
            // position) is left exactly as the user had it, not navigated away from.
            window.open(
              toMenuCommandDetailPath(locale, row.command_id, buildMenuCommandQueryString(menuCommands.filter)),
              '_blank',
              'noopener,noreferrer'
            )
          }}
        />

        {menuCommands.totalCount > 0 && (
          <PaginationPage
            page={menuCommands.filter.page_index}
            pageSize={menuCommands.filter.page_size}
            totalResults={menuCommands.totalCount}
            jumpPage={menuCommands.filter.page_index}
            handlePageSizeChange={menuCommands.handlePageSizeChange}
            handlePageChange={menuCommands.handlePageChange}
            handleJumpPage={menuCommands.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </Paper>
  )
}

export default MenuManagementContent
