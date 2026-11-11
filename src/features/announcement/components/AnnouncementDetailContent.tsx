'use client'

import type { ReactNode } from 'react'
import type { Session } from 'next-auth'
import { useRouter } from '@shared/hooks/useRouter'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CampaignIcon from '@mui/icons-material/Campaign'
import EditIcon from '@mui/icons-material/Edit'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PublishIcon from '@mui/icons-material/Publish'
import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    Link,
    Paper,
    Stack,
    Typography
} from '@mui/material'

import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { useAnnouncementPublish } from '../hooks/useAnnouncementPublish'
import type {
    AnnouncementDetailItem,
    AnnouncementDictionary,
    AnnouncementFormValues
} from '../types'
import {
    announcementText,
    commonText,
    formatAnnouncementDate,
    formatFileSize,
    getAnnouncementCategoryLabel,
    getAnnouncementStatusColor,
    getAnnouncementStatusLabel,
    getBooleanLabel,
    getLocalizedAnnouncementDetail
} from './announcementListHelpers'
import MobileAnnouncementPreview from './MobileAnnouncementPreview'

type Props = {
    dictionary: AnnouncementDictionary
    locale: string
    session: Session | null
    announcement: AnnouncementDetailItem | null
    error?: string | null
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '190px 1fr' }, gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
)

const mapPreviewValues = (announcement: AnnouncementDetailItem, locale: string): AnnouncementFormValues => {
    const localized = getLocalizedAnnouncementDetail(announcement, locale)

    return {
        title: localized.title,
        summary: localized.summary,
        category: announcement.category,
        is_pinned: announcement.is_pinned,
        require_read_confirmation: announcement.require_read_confirmation,
        notification_type: announcement.category,
        notification_icon: 'DEFAULT',
        avatar_url: null,
        avatar_preview_url: null,
        avatar_file_name: '',
        publish_at: announcement.published_on_utc,
        publish_immediately: !announcement.published_on_utc,
        content_html: localized.content,
        project: '',
        tower: '',
        floor: '',
        unit: '',
        apartment_type: '',
        translations: {
            vi: announcement.translations?.vi ?? localized,
            en: announcement.translations?.en ?? localized
        }
    }
}

const AnnouncementDetailContent = ({ dictionary, locale, session, announcement, error }: Props) => {
    const router = useRouter()
    const localized = announcement ? getLocalizedAnnouncementDetail(announcement, locale) : null
    const previewValues = announcement ? mapPreviewValues(announcement, locale) : null
    const publishAction = useAnnouncementPublish({
        announcement,
        session,
        locale,
        messages: {
            published_readonly: announcementText(dictionary, 'published_readonly', 'Thông báo đã phát hành, không được phép chỉnh sửa.'),
            confirm_publish_title: announcementText(dictionary, 'confirm_publish_title', 'Xác nhận phát hành'),
            confirm_publish_message: announcementText(dictionary, 'confirm_publish_message', 'Sau khi phát hành, thông báo sẽ không thể chỉnh sửa. Bạn có chắc muốn phát hành không?'),
            confirm_publish_action: announcementText(dictionary, 'confirm_publish_action', 'Xác nhận phát hành'),
            publish_success: announcementText(dictionary, 'publish_success', 'Phát hành thông báo thành công'),
            publish_failed: announcementText(dictionary, 'publish_failed', 'Phát hành thông báo thất bại')
        }
    })
    return (
        <Box className="mx-auto p-6">
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                        <Stack direction="row" gap={1.5} alignItems="flex-start">
                            <CampaignIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
                            <Stack>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {announcementText(dictionary, 'announcement_detail', 'Chi tiết thông báo')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {localized?.title || announcementText(dictionary, 'announcement_detail_description', 'Xem thông tin chi tiết thông báo gửi đến cư dân.')}
                                </Typography>
                            </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
                            {announcement && !publishAction.isPublished && (
                                <>
                                    <PermissionGuard href="/announcement" action="MODIFY">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<PublishIcon fontSize="small" />}
                                            onClick={publishAction.publish}
                                            disabled={publishAction.publishing}
                                            sx={{ height: 40, px: 2, fontSize: 14 }}
                                        >
                                            {announcementText(dictionary, 'publish', 'Phát hành')}
                                        </Button>
                                    </PermissionGuard>
                                    <PermissionGuard href="/announcement" action="MODIFY">
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<EditIcon fontSize="small" />}
                                            onClick={() => router.push(`/${locale}/announcement/${announcement.id}/edit`)}
                                            disabled={publishAction.publishing}
                                            sx={{ height: 40, px: 2, fontSize: 14 }}
                                        >
                                            {announcementText(dictionary, 'edit_announcement', 'Sửa thông báo')}
                                        </Button>
                                    </PermissionGuard>
                                </>
                            )}
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ArrowBackIcon fontSize="small" />}
                                onClick={() => router.push(`/${locale}/announcement`)}
                                sx={{ height: 40, px: 2, fontSize: 14 }}
                            >
                                {commonText(dictionary, 'back', 'Quay lại')}
                            </Button>
                        </Stack>
                    </Stack>

                    {error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : !announcement ? (
                        <Alert severity="warning">
                            {announcementText(dictionary, 'announcement_not_found', 'Không tìm thấy thông báo')}
                        </Alert>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, lg: 8 }}>
                                <Stack spacing={3}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{localized?.title || '-'}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    {localized?.summary || '-'}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                                                    {announcementText(dictionary, 'content', 'Nội dung')}
                                                </Typography>
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 1.5,
                                                        bgcolor: 'background.default',
                                                        color: 'text.primary',
                                                        fontSize: 14,
                                                        lineHeight: 1.8,
                                                        '& p': { my: 1 },
                                                        '& ul, & ol': { pl: 3, my: 1 },
                                                        '& li': { mb: 0.5 },
                                                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                                                        '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 1 },
                                                        '& table': {
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            my: 1,
                                                            fontSize: 'inherit'
                                                        },
                                                        '& th, & td': {
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            px: 1,
                                                            py: 0.75,
                                                            verticalAlign: 'top'
                                                        },
                                                        '& figure.table': {
                                                            m: 0,
                                                            overflowX: 'auto'
                                                        }
                                                    }}
                                                >
                                                    {localized?.content ? (
                                                        <Box dangerouslySetInnerHTML={{ __html: localized.content }} />
                                                    ) : '-'}
                                                </Paper>
                                            </Box>
                                        </Stack>
                                    </Paper>

                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
                                        <Stack spacing={2}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                {announcementText(dictionary, 'general_information', 'Thông tin chung')}
                                            </Typography>
                                            <DetailRow label={announcementText(dictionary, 'category', 'Danh mục')}>
                                                <Chip size="small" variant="outlined" label={getAnnouncementCategoryLabel(announcement.category, locale, dictionary)} />
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'status', 'Trạng thái')}>
                                                <Chip
                                                    size="small"
                                                    color={getAnnouncementStatusColor(announcement.status) as any}
                                                    label={getAnnouncementStatusLabel(announcement.status, locale, dictionary)}
                                                />
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'project_code', 'Dự án')}>
                                                {announcement.project_code || announcement.project_id || '-'}
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'is_pinned', 'Ghim')}>
                                                {getBooleanLabel(announcement.is_pinned, locale, dictionary)}
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'require_read_confirmation', 'Yêu cầu xác nhận đọc')}>
                                                {getBooleanLabel(announcement.require_read_confirmation, locale, dictionary)}
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'published_on_utc', 'Ngày đăng')}>
                                                {formatAnnouncementDate(announcement.published_on_utc, locale)}
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'published_by_user_code', 'Người đăng')}>
                                                {announcement.published_by_user_code || '-'}
                                            </DetailRow>
                                            <DetailRow label={announcementText(dictionary, 'target_audience', 'Audience')}>
                                                {announcement.target_audience || '-'}
                                            </DetailRow>
                                        </Stack>
                                    </Paper>

                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
                                        <Stack spacing={1.5}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                {announcementText(dictionary, 'attachments', 'Tệp đính kèm')}
                                            </Typography>
                                            {announcement.attachments.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    {announcementText(dictionary, 'no_attachments', 'Không có tệp đính kèm')}
                                                </Typography>
                                            ) : (
                                                <Stack spacing={1}>
                                                    {announcement.attachments.map(file => (
                                                        <Paper key={file.id || file.file_url || file.file_name} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                                                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
                                                                <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                                                    <AttachFileIcon color="action" fontSize="small" />
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                                                                            {file.file_name || '-'}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {[file.file_type, formatFileSize(file.file_size)].filter(Boolean).join(' • ')}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                                {file.file_url && (
                                                                    <Link
                                                                        href={file.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}
                                                                    >
                                                                        {announcementText(dictionary, 'open_file', 'Mở file')}
                                                                        <OpenInNewIcon fontSize="inherit" />
                                                                    </Link>
                                                                )}
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Paper>
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, lg: 4 }}>
                                <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                        {announcementText(dictionary, 'mobile_preview', 'Preview mobile')}
                                    </Typography>
                                    <MobileAnnouncementPreview
                                        notificationType={previewValues?.notification_type ?? ''}
                                        title={previewValues?.title ?? ''}
                                        summary={previewValues?.summary}
                                        content={previewValues?.content_html ?? ''}
                                        avatarPreviewUrl={previewValues?.avatar_preview_url}
                                        avatarObjectKey={previewValues?.avatar_url}
                                        avatarFileName={previewValues?.avatar_file_name}
                                        notificationIcon={previewValues?.notification_icon}
                                        publishAt={previewValues?.publish_at}
                                        dictionary={dictionary}
                                        fullHeight
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}

export default AnnouncementDetailContent
