'use client'

import type { Session } from 'next-auth'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import PublishIcon from '@mui/icons-material/Publish'
import PreviewIcon from '@mui/icons-material/Preview'
import SaveIcon from '@mui/icons-material/Save'
import { Alert, Box, Button, Grid, Paper, Stack, Typography } from '@mui/material'

import type { AnnouncementDetailItem, AnnouncementDictionary, AnnouncementInitialData } from '../types'
import { useAnnouncementEdit } from '../hooks/useAnnouncementEdit'
import { announcementText, commonText } from './announcementListHelpers'
import {
    AnnouncementEditContentSection,
    AnnouncementEditMainSection,
    AnnouncementEditTargetSection
} from './AnnouncementEditSections'
import AnnouncementPreviewDialog from './AnnouncementPreviewDialog'
import AnnouncementReadonlyAttachmentsSection from './AnnouncementReadonlyAttachmentsSection'
import MobileAnnouncementPreview from './MobileAnnouncementPreview'

type Props = {
    dictionary: AnnouncementDictionary
    locale: string
    session: Session | null
    announcement: AnnouncementDetailItem | null
    initial_data: AnnouncementInitialData
    error?: string | null
}

export default function AnnouncementEditContent(props: Props) {
    if (props.error) {
        return <Box className="mx-auto p-6"><Alert severity="error">{props.error}</Alert></Box>
    }

    if (!props.announcement) {
        return (
            <Box className="mx-auto p-6">
                <Alert severity="warning">
                    {announcementText(props.dictionary, 'announcement_not_found', 'Không tìm thấy thông báo')}
                </Alert>
            </Box>
        )
    }

    return <AnnouncementEditForm {...props} announcement={props.announcement} />
}

const AnnouncementEditForm = ({
    dictionary,
    locale,
    session,
    announcement
}: Omit<Props, 'announcement'> & { announcement: AnnouncementDetailItem }) => {
    const edit = useAnnouncementEdit({
        announcement,
        session,
        locale,
        messages: {
            required: announcementText(dictionary, 'validation_required', 'Bắt buộc'),
            content_required: announcementText(dictionary, 'validation_content_required', 'Nội dung thông báo là bắt buộc.'),
            update_success: announcementText(dictionary, 'update_success', 'Cập nhật thông báo thành công'),
            update_failed: announcementText(dictionary, 'update_failed', 'Cập nhật thông báo thất bại'),
            published_readonly: announcementText(dictionary, 'published_readonly', 'Thông báo đã phát hành, không được phép chỉnh sửa.'),
            confirm_publish_title: announcementText(dictionary, 'confirm_publish_title', 'Xác nhận phát hành'),
            confirm_publish_message: announcementText(dictionary, 'confirm_publish_message', 'Sau khi phát hành, thông báo sẽ không thể chỉnh sửa. Bạn có chắc muốn phát hành không?'),
            confirm_publish_action: announcementText(dictionary, 'confirm_publish_action', 'Xác nhận phát hành'),
            publish_success: announcementText(dictionary, 'publish_success', 'Phát hành thông báo thành công'),
            publish_failed: announcementText(dictionary, 'publish_failed', 'Phát hành thông báo thất bại')
        }
    })
    const formDisabled = edit.submitting || edit.isPublished

    return (
        <Box className="mx-auto p-6">
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                        <Stack direction="row" gap={1.5} alignItems="flex-start">
                            <EditIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
                            <Stack>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {announcementText(dictionary, 'edit_announcement', 'Sửa thông báo')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {edit.values.title || announcementText(dictionary, 'edit_description', 'Cập nhật thông tin thông báo.')}
                                </Typography>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
                            <Button variant="outlined" size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={edit.backToDetail} disabled={edit.submitting} sx={{ height: 40, px: 2, fontSize: 14 }}>
                                {commonText(dictionary, 'back', 'Quay lại')}
                            </Button>
                            {!edit.isPublished && (
                                <>
                                    <Button variant="outlined" size="small" startIcon={<PublishIcon fontSize="small" />} onClick={edit.publish} disabled={edit.submitting} sx={{ height: 40, px: 2, fontSize: 14 }}>
                                        {announcementText(dictionary, 'publish', 'Phát hành')}
                                    </Button>
                                    <Button variant="contained" size="small" startIcon={<SaveIcon fontSize="small" />} onClick={() => void edit.submit()} disabled={edit.submitting} sx={{ height: 40, px: 2, fontSize: 14 }}>
                                        {edit.submitting ? announcementText(dictionary, 'saving', 'Đang lưu...') : announcementText(dictionary, 'save_changes', 'Lưu thay đổi')}
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Stack>

                    {edit.isPublished && (
                        <Alert severity="info">
                            {announcementText(dictionary, 'published_readonly', 'Thông báo đã phát hành, không được phép chỉnh sửa.')}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Stack spacing={3}>
                                <AnnouncementEditMainSection dictionary={dictionary} locale={locale} values={edit.values} errors={edit.errors} submitting={formDisabled} updateValue={edit.updateValue} />
                                <AnnouncementEditContentSection dictionary={dictionary} value={edit.values.content} error={edit.errors.content} submitting={formDisabled} onChange={value => edit.updateValue('content', value)} />
                                <AnnouncementEditTargetSection dictionary={dictionary} value={edit.values.target_audience} submitting={formDisabled} onChange={value => edit.updateValue('target_audience', value)} />
                                <AnnouncementReadonlyAttachmentsSection dictionary={dictionary} attachments={announcement.attachments} />
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="h6" fontWeight={700}>
                                        {announcementText(dictionary, 'mobile_preview', 'Preview mobile')}
                                    </Typography>
                                    <Button size="small" variant="outlined" startIcon={<PreviewIcon fontSize="small" />} onClick={edit.openPreview}>
                                        {announcementText(dictionary, 'preview', 'Preview')}
                                    </Button>
                                </Stack>
                                <MobileAnnouncementPreview
                                    notificationType={edit.previewValues.notification_type}
                                    title={edit.previewValues.title}
                                    summary={edit.previewValues.summary}
                                    content={edit.previewValues.content_html}
                                    avatarPreviewUrl={edit.previewValues.avatar_preview_url}
                                    avatarObjectKey={edit.previewValues.avatar_url}
                                    avatarFileName={edit.previewValues.avatar_file_name}
                                    notificationIcon={edit.previewValues.notification_icon}
                                    publishAt={edit.previewValues.publish_at}
                                    dictionary={dictionary}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Stack>
            </Paper>

            <AnnouncementPreviewDialog open={edit.previewOpen} values={edit.previewValues} dictionary={dictionary} onClose={edit.closePreview} />
        </Box>
    )
}
