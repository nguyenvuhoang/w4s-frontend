'use client'

import AddIcon from '@mui/icons-material/Add'
import CampaignIcon from '@mui/icons-material/Campaign'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import { resolveRowInteractionMode, RowInteractionTip } from '@/shared/components/table'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { useAnnouncementSearch } from '../hooks/useAnnouncementSearch'
import type {
    AnnouncementFilterModel,
    AnnouncementListPageProps,
    AnnouncementSearchResponse
} from '../types'
import AnnouncementFilterBar from './AnnouncementFilterBar'
import AnnouncementsTable from './AnnouncementsTable'
import { announcementText, commonText } from './announcementListHelpers'

type Props = AnnouncementListPageProps & {
    initialFilter: AnnouncementFilterModel
    initialData: AnnouncementSearchResponse
    initialError?: string | null
}

const AnnouncementsContent = ({
    dictionary,
    session,
    locale,
    initialFilter,
    initialData,
    initialError
}: Props) => {
    const sessiontoken = session?.user?.token ?? undefined
    const announcements = useAnnouncementSearch({
        dictionary,
        sessiontoken,
        language: locale,
        initialFilter,
        initialData,
        initialError
    })

    return (
        <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                        <Stack direction="row" gap={1.5} alignItems="flex-start">
                            <CampaignIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
                            <Stack>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {announcementText(dictionary, 'announcements_management', 'Quản lý thông báo')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {announcementText(dictionary, 'announcements_management_description', 'Quản lý thông báo gửi đến cư dân theo dự án.')}
                                </Typography>
                            </Stack>
                        </Stack>

                        <PermissionGuard href="/announcement" action="ADD">
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon fontSize="small" />}
                                onClick={announcements.handleCreate}
                                sx={{ height: 40, px: 2, fontSize: 14, alignSelf: { xs: 'flex-start', md: 'center' } }}
                            >
                                {announcementText(dictionary, 'create_announcement', 'Tạo thông báo')}
                            </Button>
                        </PermissionGuard>
                    </Stack>

                    <AnnouncementFilterBar
                        dictionary={dictionary}
                        locale={locale}
                        filter={announcements.draftFilter}
                        onChange={announcements.updateDraftFilter}
                        onSelectChange={announcements.applyFilter}
                        onSearch={announcements.handleSearch}
                        onReset={announcements.handleReset}
                    />

                    {announcements.error && (
                        <Alert
                            severity="error"
                            action={
                                <Button color="inherit" size="small" onClick={() => void announcements.loadData()}>
                                    {commonText(dictionary, 'retry', 'Thử lại')}
                                </Button>
                            }
                        >
                            {announcements.error}
                        </Alert>
                    )}

                    <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

                    <AnnouncementsTable
                        dictionary={dictionary}
                        locale={locale}
                        rows={announcements.rows}
                        loading={announcements.loading}
                        pageIndex={announcements.filter.page_index}
                        pageSize={announcements.filter.page_size}
                        onView={announcements.handleView}
                    />

                    {announcements.totalCount > 0 && (
                        <PaginationPage
                            page={announcements.filter.page_index + 1}
                            pageSize={announcements.filter.page_size}
                            totalResults={announcements.totalCount}
                            jumpPage={announcements.filter.page_index + 1}
                            handlePageSizeChange={announcements.handlePageSizeChange}
                            handlePageChange={(event, pageIndex) =>
                                announcements.handlePageChange(event, pageIndex - 1)
                            }
                            handleJumpPage={announcements.handleJumpPage}
                            dictionary={dictionary}
                        />
                    )}
                </Stack>
            </Paper>
        </RequireWorkingProject>
    )
}

export default AnnouncementsContent
