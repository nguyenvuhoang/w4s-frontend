'use client'

import SettingsRounded from '@mui/icons-material/SettingsRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'

import { useSystemCodeSearch } from '../hooks/useSystemCodeSearch'
import type { SystemCodesPageProps } from '../types'
import type { SystemCodeItem } from '../types'
import SystemCodesFilterBar from './SystemCodesFilterBar'
import SystemCodeEditDialog from './SystemCodeEditDialog'
import { systemCodeText } from './systemCodeHelpers'
import SystemCodesTable from './SystemCodesTable'

type Props = SystemCodesPageProps

const SystemCodesContent = ({ dictionary, locale }: Props) => {
  const systemCodes = useSystemCodeSearch({ dictionary, language: locale })
  const [selectedCode, setSelectedCode] = useState<SystemCodeItem | null>(null)
  const router = useRouter()

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <SettingsRounded color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {systemCodeText(dictionary, 'list_title', 'System Code')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {systemCodeText(dictionary, 'list_subtitle', 'Search and manage global system code lists.')}
              </Typography>
            </Stack>
          </Stack>
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => router.push(`/${locale}/system-settings/general/create`)}>
            {systemCodeText(dictionary, 'create_category_button', 'Create new category')}
          </Button>
        </Stack>
      </Paper>

      <SystemCodesFilterBar
        dictionary={dictionary}
        searchText={systemCodes.draftSearchText}
        loading={systemCodes.loading}
        onSearchTextChange={systemCodes.handleSearchTextChange}
        onSearch={systemCodes.handleSearch}
        onRefresh={systemCodes.handleRefresh}
      />

      {systemCodes.errorText && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={systemCodes.handleRefresh}>
              {systemCodeText(dictionary, 'retry', 'Retry')}
            </Button>
          }
        >
          {systemCodes.errorText}
        </Alert>
      )}

      <SystemCodesTable
        dictionary={dictionary}
        locale={locale}
        rows={systemCodes.rows}
        loading={systemCodes.loading}
        pageSize={systemCodes.filter.page_size}
        onOpenDetail={setSelectedCode}
        onAddValue={row => router.push(`/${locale}/system-settings/general/create?code_name=${encodeURIComponent(row.code_name)}&code_group=${encodeURIComponent(row.code_group)}&app=${encodeURIComponent(row.app)}`)}
      />

      {systemCodes.totalCount > 0 && (
        <PaginationPage
          page={systemCodes.filter.page_index + 1}
          pageSize={systemCodes.filter.page_size}
          totalResults={systemCodes.totalCount}
          jumpPage={systemCodes.filter.page_index + 1}
          handlePageSizeChange={systemCodes.handlePageSizeChange}
          handlePageChange={systemCodes.handlePageChange}
          handleJumpPage={systemCodes.handleJumpPage}
          dictionary={dictionary}
        />
      )}

      <SystemCodeEditDialog
        key={selectedCode?.id ?? 'none'}
        dictionary={dictionary}
        locale={locale}
        item={selectedCode}
        onClose={() => setSelectedCode(null)}
        onUpdated={async () => {
          await systemCodes.handleRefresh()
          setSelectedCode(null)
        }}
        onDeleted={async () => {
          await systemCodes.handleRefresh()
          setSelectedCode(null)
        }}
      />
    </Stack>
  )
}

export default SystemCodesContent
