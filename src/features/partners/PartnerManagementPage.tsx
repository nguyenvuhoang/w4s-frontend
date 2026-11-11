'use client'

import AddIcon from '@mui/icons-material/Add'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import { Button, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useRef } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { resolveRowInteractionMode, RowInteractionTip } from '@/shared/components/table'
import { PermissionGuard } from '@/shared/permissions/PermissionGuard'

import PartnerCreateDialog from './components/PartnerCreateDialog'
import PartnerFilterBar from './components/PartnerFilterBar'
import PartnerTable from './components/PartnerTable'
import { commonText, partnerText } from './partnerHelpers'
import { usePartnerCreate } from './hooks/usePartnerCreate'
import { usePartnerSearch } from './hooks/usePartnerSearch'
import type { PartnerFilterModel, PartnerPageProps, PartnerSearchResponse, PartnerWorkflowError } from './types'

type Props = PartnerPageProps & {
  initialFilter: PartnerFilterModel
  initialData: PartnerSearchResponse
  initialError?: PartnerWorkflowError | null
}

const PartnerManagementPage = ({ dictionary, session, locale, initialFilter, initialData, initialError = null }: Props) => {
  const partners = usePartnerSearch({ dictionary, sessiontoken: session?.user?.token ?? undefined, language: locale, initialFilter, initialData, initialError })
  // Reloads the current search/page from the backend so the new partner follows the list's own ordering.
  const create = usePartnerCreate({ dictionary, sessiontoken: session?.user?.token ?? undefined, language: locale, onCreated: partners.handleRefresh })
  const router = useRouter()
  const navigationStarted = useRef(false)

  const handleOpenDetail = (row: { id: number | string | null }) => {
    if (row.id === null || row.id === undefined || row.id === '' || navigationStarted.current) return

    navigationStarted.current = true
    router.push(`/${locale}/promotion-management/partners/${encodeURIComponent(String(row.id))}`)
  }

  return (
    <ContentWrapper title={partnerText(dictionary, 'page_title', 'Partner Management')} description={partnerText(dictionary, 'page_subtitle', 'Search and manage partners.')} icon={<HandshakeOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary} issearch>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>{partnerText(dictionary, 'list_title', 'Partners')}</Typography>
            <Typography variant="body2" color="text.secondary">{partnerText(dictionary, 'list_subtitle', 'Search and manage partners.')}</Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ minHeight: 36 }}>
            <PermissionGuard href="/promotion-management/partners" action="ADD">
              <Button variant="contained" startIcon={<AddIcon />} onClick={create.openCreate} sx={{ minWidth: 116, height: 36 }}>
                {partnerText(dictionary, 'create_button', 'Add Partner')}
              </Button>
            </PermissionGuard>
          </Stack>
        </Stack>

        <PartnerFilterBar dictionary={dictionary} filter={partners.draftFilter} onChange={partners.updateDraftFilter} onSearch={partners.handleSearch} onReset={partners.handleReset} />

        {partners.error && <WorkflowErrorAlert title={partnerText(dictionary, 'error_title', 'Unable to load partners')} description={partners.error.message} executionId={partners.error.executionId} referenceLabel={partnerText(dictionary, 'error_reference_label', 'Error Reference')} copyLabel={commonText(dictionary, 'copy', 'Copy')} copySuccessMessage={partnerText(dictionary, 'copy_error_reference_success', 'Copied error reference.')} copyFailedMessage={partnerText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')} onRetry={partners.handleRefresh} />}

        <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

        <PartnerTable dictionary={dictionary} rows={partners.rows} loading={partners.loading} pageSize={partners.filter.page_size} onOpenDetail={handleOpenDetail} />

        <PartnerCreateDialog dictionary={dictionary} create={create} />

        {partners.totalCount > 0 && <PaginationPage page={partners.filter.page_index} pageSize={partners.filter.page_size} totalResults={partners.totalCount} jumpPage={partners.filter.page_index} handlePageSizeChange={partners.handlePageSizeChange} handlePageChange={partners.handlePageChange} handleJumpPage={partners.handleJumpPage} dictionary={dictionary} />}
      </Stack>
    </ContentWrapper>
  )
}

export default PartnerManagementPage
