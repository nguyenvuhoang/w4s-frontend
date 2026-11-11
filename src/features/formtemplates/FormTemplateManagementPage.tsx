'use client'

import { useState } from 'react'

import DescriptionIcon from '@mui/icons-material/Description'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { resolveRowInteractionMode, RowInteractionTip } from '@/shared/components/table'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import FormTemplateFilterBar from './FormTemplateFilterBar'
import { commonText, formTemplateText } from './formTemplateHelpers'
import FormTemplateTable from './FormTemplateTable'
import { useFormTemplateSearch } from './hooks/useFormTemplateSearch'
import type {
  FormTemplateItem,
  FormTemplatePageProps,
  FormTemplateSearchFilter,
  FormTemplateSearchResponse
} from './types'

type Props = FormTemplatePageProps & {
  initialFilter: FormTemplateSearchFilter
  initialData: FormTemplateSearchResponse
  initialError?: string | null
}

const FormTemplateManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null
}: Props) => {
  const router = useRouter()
  const sessiontoken = session?.user?.token ?? undefined
  const [navigatingId, setNavigatingId] = useState<number | null>(null)
  const formTemplates = useFormTemplateSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  const handleViewDetail = (row: FormTemplateItem) => {
    if (!row.id || navigatingId) return

    setNavigatingId(row.id)
    router.push(`/${locale}/e-form/form-management/${row.id}`)
  }

  return (
    <ContentWrapper
      title={formTemplateText(dictionary, 'listTitle', 'Quản lý biểu mẫu')}
      description={formTemplateText(dictionary, 'listSubtitle', 'Quản lý biểu mẫu đăng ký theo từng dự án.')}
      icon={<DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={1.5}>
            <Stack spacing={0.25}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {formTemplateText(dictionary, 'listTitle2', 'Danh sách biểu mẫu')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formTemplates.selectedProject
                  ? `${formTemplateText(dictionary, 'viewingProject', 'Đang xem')}: ${formatProjectLabel(formTemplates.selectedProject)}`
                  : formTemplateText(dictionary, 'selectProjectHint', 'Chọn dự án để xem danh sách biểu mẫu.')}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              {formTemplates.totalCount} {formTemplateText(dictionary, 'formTemplates', 'biểu mẫu')}
            </Typography>
          </Stack>
        </Paper>

            <FormTemplateFilterBar
              dictionary={dictionary}
              filter={formTemplates.draftFilter}
              disabled={formTemplates.loading}
              onChange={formTemplates.updateDraftFilter}
              onSearch={formTemplates.handleSearch}
              onReset={formTemplates.handleReset}
            />

            {formTemplates.error && (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => void formTemplates.loadData()}>
                    {commonText(dictionary, 'retry', 'Retry')}
                  </Button>
                }
              >
                {formTemplates.error}
              </Alert>
            )}

            <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

            <FormTemplateTable
              dictionary={dictionary}
              locale={locale}
              rows={formTemplates.rows}
              loading={formTemplates.loading}
              navigatingId={navigatingId}
              onRowDoubleClick={handleViewDetail}
            />

            {formTemplates.totalCount > 0 && (
              <PaginationPage
                page={formTemplates.filter.page_index}
                pageSize={formTemplates.filter.page_size}
                totalResults={formTemplates.totalCount}
                jumpPage={formTemplates.filter.page_index}
                handlePageSizeChange={formTemplates.handlePageSizeChange}
                handlePageChange={formTemplates.handlePageChange}
                handleJumpPage={formTemplates.handleJumpPage}
                dictionary={dictionary}
              />
            )}
      </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default FormTemplateManagementPage
