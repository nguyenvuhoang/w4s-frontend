'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import AddAlertIcon from '@mui/icons-material/AddAlert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import PreviewIcon from '@mui/icons-material/Preview'
import SaveIcon from '@mui/icons-material/Save'
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Radio,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { useCreateAnnouncementForm } from '../hooks/useCreateAnnouncementForm'
import AnnouncementCreateSuccessView from './AnnouncementCreateSuccessView'
import type { AnnouncementPageProps } from '../types'
import { MAX_ANNOUNCEMENT_FILE_SIZE, MAX_ANNOUNCEMENT_SUMMARY_LENGTH } from '../types'
import AudienceSection from './AudienceSection'
import AnnouncementAvatarUpload from './AnnouncementAvatarUpload'
import AnnouncementEditorFullscreenDialog from './AnnouncementEditorFullscreenDialog'
import AnnouncementIconPickerDialog from './AnnouncementIconPickerDialog'
import AnnouncementPreviewDialog from './AnnouncementPreviewDialog'
import AnnouncementTitleField from './AnnouncementTitleField'
import MobileAnnouncementPreview from './MobileAnnouncementPreview'
import { announcementSelectMenuSx, commonText, getAnnouncementCategoryLabel } from './announcementListHelpers'
import {
    getAnnouncementIconLabel,
    getAnnouncementIconOption,
    resolveAnnouncementIconKey
} from './announcementIconOptions'

const categoryValues = ['NEWS', 'OPERATION', 'ANNOUNCEMENT', 'EVENT', 'MAINTENANCE', 'OTHER']

const AnnouncementRichTextEditor = dynamic(() => import('./AnnouncementRichTextEditor'), {
    ssr: false,
    loading: () => (
        <Box
            sx={{
                minHeight: 280,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
            }}
        />
    )
})

const text = (dictionary: any, section: string, key: string, fallback: string) => (
    dictionary?.[section]?.[key] ?? dictionary?.common?.[key] ?? fallback
)

const formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`

const getCreateNotificationTypes = (dictionary: AnnouncementPageProps['dictionary']) => [
    {
        value: 'EMAIL',
        label: text(dictionary, 'announcement', 'notification_method_mail', 'Mail'),
        icon: <MailOutlineIcon fontSize="small" />
    },
    {
        value: 'SMS',
        label: text(dictionary, 'announcement', 'notification_method_sms', 'SMS'),
        icon: <SmsOutlinedIcon fontSize="small" />
    }
]

export default function CreateAnnouncementContent({ dictionary, session, locale, initial_data }: AnnouncementPageProps) {
    const [editorFullscreenOpen, setEditorFullscreenOpen] = useState(false)
    const [iconPickerOpen, setIconPickerOpen] = useState(false)
    const {
        values,
        attachments,
        errors,
        saving,
        avatarUploading,
        audienceLoading,
        audienceOptions,
        previewOpen,
        minPublishAt,
        createSuccess,
        createdAnnouncement,
        updateValue,
        changePublishAt,
        togglePublishImmediately,
        updateTitleDraft,
        commitTitle,
        setAvatarUploading,
        changeAudienceValue,
        addFiles,
        removeAttachment,
        openPreview,
        closePreview,
        goBack,
        submit,
        startNewAnnouncement
    } = useCreateAnnouncementForm(session, locale, {
        required: text(dictionary, 'announcement', 'validation_required', 'This field is required.'),
        project_required: text(dictionary, 'announcement', 'project_required', 'Please select a project'),
        publish_time_past: text(dictionary, 'announcement', 'publish_time_past', 'Publish time cannot be in the past.'),
        publish_time_required: text(dictionary, 'announcement', 'publish_time_required', 'Please select a publish time.'),
        notification_method_required: text(dictionary, 'announcement', 'validation_notification_method_required', 'Please select notification method'),
        content_required: text(dictionary, 'announcement', 'validation_content_required', 'Content is required.'),
        file_too_large: text(dictionary, 'announcement', 'validation_file_too_large', '{file} exceeds the 5MB limit.'),
        upload_failed: text(dictionary, 'announcement', 'upload_failed', 'Upload failed.'),
        create_success: text(dictionary, 'announcement', 'create_success', 'Announcement created successfully.'),
        create_failed: text(dictionary, 'announcement', 'create_failed', 'Create announcement failed.'),
        avatar_invalid_type: text(dictionary, 'announcement', 'avatar_invalid_type', 'Please choose a PNG, JPG, JPEG or WEBP image up to 5MB.'),
        avatar_upload_failed: text(dictionary, 'announcement', 'avatar_upload_failed', 'Unable to upload image.'),
        audience_all_residents: text(dictionary, 'announcement', 'audience_all_residents', 'All residents')
    }, initial_data)

    const notificationTypes = useMemo(() => getCreateNotificationTypes(dictionary), [dictionary])
    const selectedIcon = useMemo(
        () => getAnnouncementIconOption(values.notification_icon, values.notification_type),
        [values.notification_icon, values.notification_type]
    )
    const SelectedIcon = selectedIcon.icon
    const selectedIconLabel = getAnnouncementIconLabel(
        dictionary,
        selectedIcon.key,
        selectedIcon.label
    )
    const formDisabled = saving || avatarUploading
    const hasCustomIcon = values.notification_icon && values.notification_icon !== 'DEFAULT'
    const previewTitle = values.notification_type === 'SMS'
        ? text(dictionary, 'announcement', 'mobile_preview', 'Mobile preview')
        : text(dictionary, 'announcement', 'email_preview', 'Email preview')
    const avatarFallbackIcon = useMemo(() => <SelectedIcon fontSize="small" />, [SelectedIcon])
    const handleAvatarChange = useCallback((url: string | null, fileName?: string) => {
        updateValue('avatar_url', url)
        updateValue('avatar_file_name', fileName ?? '')
    }, [updateValue])
    const handleAvatarPreviewChange = useCallback((url: string | null) => {
        updateValue('avatar_preview_url', url)
    }, [updateValue])
    const handleContentChange = useCallback((value: string) => {
        updateValue('content_html', value)
    }, [updateValue])
    const handleIconSelect = useCallback((iconKey: string) => {
        updateValue('notification_icon', iconKey)
    }, [updateValue])
    const handleEditorOpen = useCallback(() => {
        setEditorFullscreenOpen(true)
    }, [])
    const handleEditorClose = useCallback(() => {
        setEditorFullscreenOpen(false)
    }, [])
    const handleIconPickerOpen = useCallback(() => {
        setIconPickerOpen(true)
    }, [])
    const handleIconPickerClose = useCallback(() => {
        setIconPickerOpen(false)
    }, [])

    return (
        <ContentWrapper
            title={text(dictionary, 'announcement', 'create_title', 'Create Announcement')}
            description={text(dictionary, 'announcement', 'create_description', 'Create a rich notification for mobile residents.')}
            icon={<AddAlertIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch={false}
        >
            {createSuccess && createdAnnouncement ? (
                <Box sx={{ my: 5 }}>
                    <AnnouncementCreateSuccessView
                        dictionary={dictionary}
                        locale={locale}
                        createdAnnouncement={createdAnnouncement}
                        onCreateAnother={startNewAnnouncement}
                        onBackToList={goBack}
                    />
                </Box>
            ) : (
            <Box sx={{ my: 5 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                    {text(dictionary, 'announcement', 'main_information', 'Main information')}
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <AnnouncementTitleField
                                            label={text(dictionary, 'announcement', 'field_title', 'Title')}
                                            value={values.title}
                                            error={errors.title}
                                            disabled={formDisabled}
                                            onDraftChange={updateTitleDraft}
                                            onCommit={commitTitle}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            required
                                            multiline
                                            minRows={3}
                                            label={text(dictionary, 'announcement', 'field_summary', 'Summary')}
                                            value={values.summary}
                                            error={Boolean(errors.summary)}
                                            helperText={errors.summary || `${values.summary.length}/${MAX_ANNOUNCEMENT_SUMMARY_LENGTH}`}
                                            disabled={formDisabled}
                                            slotProps={{ htmlInput: { maxLength: MAX_ANNOUNCEMENT_SUMMARY_LENGTH } }}
                                            onChange={event => updateValue('summary', event.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label={text(dictionary, 'announcement', 'category', 'Category')}
                                            value={values.category}
                                            disabled={formDisabled}
                                            onChange={event => updateValue('category', event.target.value)}
                                            SelectProps={{
                                                MenuProps: {
                                                    PaperProps: {
                                                        sx: announcementSelectMenuSx
                                                    }
                                                }
                                            }}
                                        >
                                            {categoryValues.map(category => (
                                                <MenuItem key={category} value={category}>
                                                    {getAnnouncementCategoryLabel(category, locale, dictionary)}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 3 }}>
                                        <FormControlLabel
                                            control={(
                                                <Switch
                                                    checked={values.is_pinned}
                                                    disabled={formDisabled}
                                                    onChange={event => updateValue('is_pinned', event.target.checked)}
                                                />
                                            )}
                                            label={text(dictionary, 'announcement', 'is_pinned', 'Pinned')}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 3 }}>
                                        <FormControlLabel
                                            control={(
                                                <Switch
                                                    checked={values.require_read_confirmation}
                                                    disabled={formDisabled}
                                                    onChange={event => updateValue('require_read_confirmation', event.target.checked)}
                                                />
                                            )}
                                            label={text(dictionary, 'announcement', 'require_read_confirmation', 'Require read confirmation')}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <FormControl fullWidth required error={Boolean(errors.notification_type)} disabled={formDisabled}>
                                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                                {text(dictionary, 'announcement', 'notification_method', 'Notification method')}
                                            </Typography>
                                            <Grid container spacing={1.5}>
                                                {notificationTypes.map(option => {
                                                    const selected = values.notification_type === option.value

                                                    return (
                                                        <Grid key={option.value} size={{ xs: 12, sm: 6 }}>
                                                            <Paper
                                                                component="label"
                                                                variant="outlined"
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1.25,
                                                                    p: 1.5,
                                                                    borderRadius: 1.5,
                                                                    cursor: formDisabled ? 'default' : 'pointer',
                                                                    borderColor: selected ? 'primary.main' : 'divider',
                                                                    bgcolor: selected ? 'action.hover' : 'background.paper',
                                                                    transition: 'border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease',
                                                                    '&:hover': formDisabled ? undefined : {
                                                                        borderColor: 'primary.main',
                                                                        bgcolor: 'action.hover'
                                                                    }
                                                                }}
                                                            >
                                                                <Radio
                                                                    size="small"
                                                                    checked={selected}
                                                                    value={option.value}
                                                                    disabled={formDisabled}
                                                                    onChange={() => updateValue('notification_type', option.value)}
                                                                    sx={{ p: 0.5 }}
                                                                />
                                                                <Box sx={{ width: 34, height: 34, borderRadius: 1.25, bgcolor: selected ? 'rgba(33, 80, 134, 0.08)' : 'grey.100', color: selected ? 'primary.main' : 'text.secondary', display: 'grid', placeItems: 'center' }}>
                                                                    {option.icon}
                                                                </Box>
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {option.label}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                    )
                                                })}
                                            </Grid>
                                            <FormHelperText>{errors.notification_type || text(dictionary, 'announcement', 'notification_method_helper', 'Choose Mail or SMS.')}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Stack spacing={0.5}>
                                            <FormControlLabel
                                                control={(
                                                    <Checkbox
                                                        checked={values.publish_immediately}
                                                        disabled={formDisabled}
                                                        onChange={event => togglePublishImmediately(event.target.checked)}
                                                    />
                                                )}
                                                label={text(dictionary, 'announcement', 'publish_immediately_label', 'Publish immediately once approved')}
                                            />
                                            <TextField
                                                fullWidth
                                                required={!values.publish_immediately}
                                                label={text(dictionary, 'announcement', 'publish_time', 'Publish time')}
                                                type="datetime-local"
                                                InputLabelProps={{ shrink: true }}
                                                value={values.publish_at}
                                                error={Boolean(errors.publish_at)}
                                                disabled={formDisabled || values.publish_immediately}
                                                helperText={errors.publish_at || (
                                                    values.publish_immediately
                                                        ? text(dictionary, 'announcement', 'publish_time_disabled_helper', 'Uncheck "Publish immediately once approved" to schedule a time.')
                                                        : text(dictionary, 'announcement', 'publish_time_required_helper', 'Select a publish time (must be after the current time).')
                                                )}
                                                slotProps={{
                                                    htmlInput: { min: minPublishAt || undefined },
                                                    input: {
                                                        endAdornment: values.publish_at ? (
                                                            <InputAdornment position="end">
                                                                <Tooltip title={text(dictionary, 'announcement', 'publish_time_clear', 'Clear selected time')}>
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            edge="end"
                                                                            disabled={formDisabled || values.publish_immediately}
                                                                            onClick={() => changePublishAt('')}
                                                                        >
                                                                            <ClearIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            </InputAdornment>
                                                        ) : undefined
                                                    }
                                                }}
                                                onChange={event => changePublishAt(event.target.value)}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                            {text(dictionary, 'announcement', 'notification_avatar', 'Avatar / Notification icon')}
                                        </Typography>
                                        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2 }}>
                                            <Stack spacing={2}>
                                                <AnnouncementAvatarUpload
                                                    value={values.avatar_url}
                                                    previewUrl={values.avatar_preview_url}
                                                    fileName={values.avatar_file_name}
                                                    disabled={saving}
                                                    dictionary={dictionary}
                                                    fallbackIcon={avatarFallbackIcon}
                                                    onUploadingChange={setAvatarUploading}
                                                    onChange={handleAvatarChange}
                                                    onPreviewChange={handleAvatarPreviewChange}
                                                />
                                                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {text(dictionary, 'announcement', 'selected_icon', 'Selected icon')}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {selectedIconLabel}
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        disabled={formDisabled}
                                                        onClick={handleIconPickerOpen}
                                                    >
                                                        {hasCustomIcon
                                                            ? text(dictionary, 'announcement', 'change_icon', 'Change icon')
                                                            : text(dictionary, 'announcement', 'choose_icon', 'Choose icon')}
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper sx={{ p: 3 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Typography variant="h6" fontWeight={700}>
                                        {text(dictionary, 'announcement', 'content_section', 'Notification content')}
                                    </Typography>
                                    <Tooltip title={text(dictionary, 'announcement', 'expand_editor_tooltip', 'Expand editor')}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<OpenInFullIcon fontSize="small" />}
                                            disabled={formDisabled}
                                            onClick={handleEditorOpen}
                                        >
                                            {text(dictionary, 'announcement', 'expand_editor', 'Expand')}
                                        </Button>
                                    </Tooltip>
                                </Stack>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                    {text(dictionary, 'announcement', 'field_content', 'Notification content')}
                                </Typography>
                                <AnnouncementRichTextEditor
                                    value={values.content_html}
                                    disabled={formDisabled}
                                    error={errors.content_html}
                                    onChange={handleContentChange}
                                />

                                <Box sx={{ mt: 3 }}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2}>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700}>{text(dictionary, 'announcement', 'attachments', 'Attachments')}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {text(dictionary, 'announcement', 'max_file_size', 'Max {size} per file.').replace('{size}', formatFileSize(MAX_ANNOUNCEMENT_FILE_SIZE))}
                                            </Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" startIcon={<AttachFileIcon />} disabled={formDisabled}>
                                            {text(dictionary, 'announcement', 'select_files', 'Select files')}
                                            <input hidden multiple type="file" onChange={event => {
                                                if (event.target.files) addFiles(event.target.files)
                                                event.target.value = ''
                                            }} />
                                        </Button>
                                    </Stack>
                                    {errors.attachments && <Alert severity="error" sx={{ mt: 1.5 }}>{errors.attachments}</Alert>}
                                    <Stack spacing={1} sx={{ mt: 2 }}>
                                        {attachments.map((attachment, index) => (
                                            <Stack
                                                key={`${attachment.name}-${index}`}
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" noWrap>{attachment.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{formatFileSize(attachment.size)}</Typography>
                                                </Box>
                                                <Tooltip title={text(dictionary, 'announcement', 'remove_attachment', 'Remove')}>
                                                    <IconButton size="small" disabled={formDisabled} onClick={() => removeAttachment(index)}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            </Paper>

                            <AudienceSection
                                values={values}
                                options={audienceOptions}
                                loading={audienceLoading}
                                saving={formDisabled}
                                dictionary={dictionary}
                                projectError={errors.project}
                                onChange={changeAudienceValue}
                            />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                <Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={goBack} disabled={formDisabled}>
                                    {commonText(dictionary, 'back', 'Back')}
                                </Button>
                                <Button variant="outlined" startIcon={<PreviewIcon />} onClick={openPreview} disabled={formDisabled}>
                                    {text(dictionary, 'announcement', 'preview', 'Preview')}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                    onClick={() => void submit()}
                                    disabled={formDisabled}
                                    aria-busy={saving}
                                >
                                    {saving
                                        ? text(dictionary, 'announcement', 'saving', 'Saving...')
                                        : avatarUploading
                                            ? text(dictionary, 'announcement', 'avatar_uploading', 'Uploading image...')
                                            : text(dictionary, 'announcement', 'save', 'Save')}
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{previewTitle}</Typography>
                            <MobileAnnouncementPreview
                                notificationType={values.notification_type}
                                title={values.title}
                                summary={values.summary}
                                content={values.content_html}
                                avatarPreviewUrl={values.avatar_preview_url}
                                avatarObjectKey={values.avatar_url}
                                avatarFileName={values.avatar_file_name}
                                notificationIcon={values.notification_icon}
                                publishAt={values.publish_at}
                                dictionary={dictionary}
                            />
                        </Box>
                    </Grid>
                </Grid>

                <AnnouncementPreviewDialog
                    open={previewOpen}
                    values={values}
                    dictionary={dictionary}
                    onClose={closePreview}
                />

                <AnnouncementEditorFullscreenDialog
                    open={editorFullscreenOpen}
                    dictionary={dictionary}
                    value={values.content_html}
                    disabled={formDisabled}
                    error={errors.content_html}
                    onClose={handleEditorClose}
                    onChange={handleContentChange}
                />

                <AnnouncementIconPickerDialog
                    open={iconPickerOpen}
                    selectedKey={resolveAnnouncementIconKey(values.notification_icon, values.notification_type)}
                    notificationType={values.notification_type}
                    dictionary={dictionary}
                    onClose={handleIconPickerClose}
                    onSelect={handleIconSelect}
                />
            </Box>
            )}
        </ContentWrapper>
    )
}
