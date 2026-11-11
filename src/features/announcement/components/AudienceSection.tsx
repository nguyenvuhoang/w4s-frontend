'use client'

import { memo } from 'react'
import GroupsIcon from '@mui/icons-material/Groups'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Divider,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material'

import { labelSx } from '@/features/resident/components/create-resident-profile/formControls'
import type { AnnouncementDictionary, AnnouncementFormValues, AnnouncementInitialData } from '../types'
import { announcementSelectMenuSx, announcementText, commonText } from './announcementListHelpers'

type Props = {
    values: AnnouncementFormValues
    options: Omit<AnnouncementInitialData, 'notification_types'>
    loading: boolean
    saving: boolean
    dictionary: AnnouncementDictionary
    projectError?: string
    onChange: (key: keyof Pick<AnnouncementFormValues, 'project' | 'tower' | 'floor' | 'unit' | 'apartment_type'>, value: string) => void
}

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        minHeight: 40,
        borderRadius: 1.5,
        bgcolor: 'background.paper'
    },
    '& .MuiSelect-select': {
        py: 1.125,
        fontSize: 14
    }
}

function AudienceSection({ values, options, loading, saving, dictionary, projectError, onChange }: Props) {
    const fields = [
        ['project', announcementText(dictionary, 'project', 'Project'), options.projects],
        ['tower', announcementText(dictionary, 'tower', 'Tower'), options.towers],
        ['floor', announcementText(dictionary, 'floor', 'Floor'), options.floors],
        ['unit', announcementText(dictionary, 'unit', 'Unit'), options.units],
        ['apartment_type', announcementText(dictionary, 'apartment_type', 'Apartment type'), options.apartment_types]
    ] as const
    const selectedUnit = options.units.find(option => option.value === values.unit)
    const ownerName = selectedUnit?.head_of_household_name || selectedUnit?.owner_name

    return (
        <Card
            sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                overflow: 'hidden'
            }}
        >
            <CardHeader
                avatar={(
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <GroupsIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                )}
                title={<Typography variant="h6" sx={{ fontWeight: 800 }}>{announcementText(dictionary, 'audience', 'Audience')}</Typography>}
                sx={{ p: 3, pb: 0, mb: 2 }}
            />
            <Divider sx={{ mx: 3 }} />
            <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'action.hover'
                        }}
                    >
                        <InfoOutlinedIcon color="primary" sx={{ fontSize: 18, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                            {announcementText(dictionary, 'audience_description', 'Leave audience empty to apply this announcement to all residents.')}
                        </Typography>
                    </Box>

                    <Grid container spacing={5}>
                        {fields.map(([key, label, options]) => (
                            <Grid key={key} size={{ xs: 12, md: key === 'apartment_type' ? 12 : 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    required={key === 'project'}
                                    error={key === 'project' && Boolean(projectError)}
                                    helperText={key === 'project' ? projectError : undefined}
                                    label={label}
                                    value={values[key]}
                                    disabled={saving || loading}
                                    onChange={event => onChange(key, event.target.value)}
                                    slotProps={{
                                        inputLabel: { sx: labelSx }
                                    }}
                                    SelectProps={{
                                        MenuProps: {
                                            PaperProps: {
                                                sx: announcementSelectMenuSx
                                            }
                                        },
                                        endAdornment: loading ? <CircularProgress color="inherit" size={16} sx={{ mr: 2 }} /> : undefined
                                    }}
                                    sx={fieldSx}
                                >
                                    {key !== 'project' && <MenuItem value="">{commonText(dictionary, 'all', 'All')}</MenuItem>}
                                    {options.map(option => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        ))}
                    </Grid>

                    {values.unit && (
                        <Box
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                bgcolor: 'background.default',
                                px: 1.5,
                                py: 1.25
                            }}
                        >
                            <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {announcementText(dictionary, 'apartment', 'Apartment')}: {selectedUnit?.apartment_code || selectedUnit?.label || values.unit}
                                </Typography>
                                <Typography variant="body2" color={ownerName ? 'text.primary' : 'text.secondary'}>
                                    {announcementText(dictionary, 'owner', 'Owner')}: {ownerName || announcementText(dictionary, 'owner_missing', 'No owner information available')}
                                </Typography>
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    )
}

export default memo(AudienceSection, (prev, next) => (
    prev.loading === next.loading
    && prev.saving === next.saving
    && prev.dictionary === next.dictionary
    && prev.options === next.options
    && prev.onChange === next.onChange
    && prev.projectError === next.projectError
    && prev.values.project === next.values.project
    && prev.values.tower === next.values.tower
    && prev.values.floor === next.values.floor
    && prev.values.unit === next.values.unit
    && prev.values.apartment_type === next.values.apartment_type
))
