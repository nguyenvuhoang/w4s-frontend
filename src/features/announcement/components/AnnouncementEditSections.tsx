'use client'

import dynamic from 'next/dynamic'
import {
    Box,
    FormControlLabel,
    Grid,
    MenuItem,
    Paper,
    Switch,
    TextField,
    Typography
} from '@mui/material'

import type {
    AnnouncementDictionary,
    UpdateAnnouncementFormValues
} from '../types'
import {
    announcementText,
    getAnnouncementCategoryLabel,
    getAnnouncementStatusLabel
} from './announcementListHelpers'

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

type UpdateValue = <K extends keyof UpdateAnnouncementFormValues>(key: K, value: UpdateAnnouncementFormValues[K]) => void

const categoryValues = ['NEWS', 'OPERATION', 'ANNOUNCEMENT', 'EVENT', 'MAINTENANCE', 'OTHER']
const statusValues = ['A', 'I', 'B', 'DRAFT', 'R']

export const AnnouncementEditMainSection = ({
    dictionary,
    locale,
    values,
    errors,
    submitting,
    updateValue
}: {
    dictionary: AnnouncementDictionary
    locale: string
    values: UpdateAnnouncementFormValues
    errors: Partial<Record<keyof UpdateAnnouncementFormValues, string>>
    submitting: boolean
    updateValue: UpdateValue
}) => (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            {announcementText(dictionary, 'main_information', 'Thông tin chính')}
        </Typography>
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    required
                    label={announcementText(dictionary, 'field_title', 'Tiêu đề')}
                    value={values.title}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    disabled={submitting}
                    onChange={event => updateValue('title', event.target.value)}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    required
                    multiline
                    minRows={2}
                    label={announcementText(dictionary, 'field_summary', 'Tóm tắt')}
                    value={values.summary}
                    error={Boolean(errors.summary)}
                    helperText={errors.summary}
                    disabled={submitting}
                    onChange={event => updateValue('summary', event.target.value)}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    select
                    fullWidth
                    label={announcementText(dictionary, 'category', 'Danh mục')}
                    value={values.category}
                    disabled={submitting}
                    onChange={event => updateValue('category', event.target.value)}
                >
                    {categoryValues.map(category => (
                        <MenuItem key={category} value={category}>
                            {getAnnouncementCategoryLabel(category, locale, dictionary)}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    select
                    fullWidth
                    label={announcementText(dictionary, 'status', 'Trạng thái')}
                    value={values.status}
                    disabled={submitting}
                    onChange={event => updateValue('status', event.target.value)}
                >
                    {statusValues.map(status => (
                        <MenuItem key={status} value={status}>
                            {getAnnouncementStatusLabel(status, locale, dictionary)}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                    control={<Switch checked={values.is_pinned} disabled={submitting} onChange={event => updateValue('is_pinned', event.target.checked)} />}
                    label={announcementText(dictionary, 'is_pinned', 'Ghim')}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                    control={<Switch checked={values.require_read_confirmation} disabled={submitting} onChange={event => updateValue('require_read_confirmation', event.target.checked)} />}
                    label={announcementText(dictionary, 'require_read_confirmation', 'Yêu cầu xác nhận đọc')}
                />
            </Grid>
        </Grid>
    </Paper>
)

export const AnnouncementEditContentSection = ({
    dictionary,
    value,
    error,
    submitting,
    onChange
}: {
    dictionary: AnnouncementDictionary
    value: string
    error?: string
    submitting: boolean
    onChange: (value: string) => void
}) => (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            {announcementText(dictionary, 'content_section', 'Nội dung thông báo')}
        </Typography>
        <AnnouncementRichTextEditor value={value} disabled={submitting} error={error} onChange={onChange} />
    </Paper>
)

export const AnnouncementEditTargetSection = ({ dictionary, value, submitting, onChange }: {
    dictionary: AnnouncementDictionary
    value: string
    submitting: boolean
    onChange: (value: string) => void
}) => (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            {announcementText(dictionary, 'target_audience', 'Đối tượng nhận thông báo')}
        </Typography>
        <TextField
            fullWidth
            label={announcementText(dictionary, 'target_audience', 'Đối tượng nhận thông báo')}
            value={value}
            disabled={submitting}
            onChange={event => onChange(event.target.value)}
        />
    </Paper>
)
