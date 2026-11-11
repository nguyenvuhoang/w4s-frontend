'use client'

import ForumIcon from '@mui/icons-material/Forum'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import ResidentFeedbackFilterBar from './components/ResidentFeedbackFilterBar'
import { commonText, residentFeedbackText } from './components/residentFeedbackHelpers'
import ResidentFeedbackTable from './components/ResidentFeedbackTable'
import { useResidentFeedback } from './hooks/useResidentFeedback'
import type {
    ResidentFeedbackFilter,
    ResidentFeedbackPageProps,
    ResidentFeedbackSearchResponse
} from './types'

type Props = ResidentFeedbackPageProps & {
    initialFilter: ResidentFeedbackFilter
    initialData: ResidentFeedbackSearchResponse
    initialError?: string | null
}

const ResidentFeedbackPage = ({
    dictionary,
    session,
    locale,
    initialFilter,
    initialData,
    initialError = null
}: Props) => {
    const sessiontoken = session?.user?.token ?? undefined
    const feedback = useResidentFeedback({
        dictionary,
        sessiontoken,
        language: locale,
        initialFilter,
        initialData,
        initialError
    })

    return (
        <ContentWrapper
            title={residentFeedbackText(dictionary, 'page_title')}
            description={residentFeedbackText(dictionary, 'page_subtitle')}
            icon={<ForumIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
          <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={1.5}>
                        <Stack spacing={0.25}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {residentFeedbackText(dictionary, 'feedback_section_title')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {feedback.selectedProject
                                    ? `${residentFeedbackText(dictionary, 'viewing_project')}: ${formatProjectLabel(feedback.selectedProject)}`
                                    : residentFeedbackText(dictionary, 'select_project_hint')}
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>

                <ResidentFeedbackFilterBar
                    dictionary={dictionary}
                    filter={feedback.draftFilter}
                    disabled={feedback.loading}
                    onChange={feedback.updateDraftFilter}
                    onStatusChange={feedback.applyFilter}
                    onSearch={feedback.handleSearch}
                    onReset={feedback.handleReset}
                />

                {feedback.error && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => void feedback.loadData()}>
                                {commonText(dictionary, 'retry')}
                            </Button>
                        }
                    >
                        <>
                            {feedback.error.message}
                            {feedback.error.executionId && ` ${residentFeedbackText(dictionary, 'error_reference')}: ${feedback.error.executionId}`}
                        </>
                    </Alert>
                )}

                <ResidentFeedbackTable
                    dictionary={dictionary}
                    locale={locale}
                    rows={feedback.rows}
                    loading={feedback.loading}
                    pageIndex={feedback.filter.page_index}
                    pageSize={feedback.filter.page_size}
                    onRowDoubleClick={feedback.openDetail}
                />

                {feedback.totalCount > 0 && (
                    <PaginationPage
                        page={feedback.filter.page_index + 1}
                        pageSize={feedback.filter.page_size}
                        totalResults={feedback.totalCount}
                        jumpPage={feedback.filter.page_index + 1}
                        handlePageSizeChange={feedback.handlePageSizeChange}
                        handlePageChange={(_event, page) => feedback.handlePageChange(_event, page - 1)}
                        handleJumpPage={feedback.handleJumpPage}
                        dictionary={dictionary}
                    />
                )}
            </Stack>
          </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default ResidentFeedbackPage
