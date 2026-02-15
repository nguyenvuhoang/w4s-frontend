import {
    Avatar,
    Card, CardContent, CardHeader, Divider, FormControlLabel,
    Grid, MenuItem, Stack, Switch, TextField, Typography
} from '@mui/material'
import BadgeIcon from '@mui/icons-material/Badge'
import { Control, Controller } from 'react-hook-form'
import { FormValues } from '../types'

// Style chung cho label màu primary
const labelSx = { color: 'primary.main', '&.Mui-focused': { color: 'primary.main' } }

type BasicInfoCardProps = {
    control: Control<FormValues>
    dict: Record<string, string>
}

export default function BasicInfoCard({
    control,
    dict
}: BasicInfoCardProps) {
    return (
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <BadgeIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                }
                title={
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {dict.details || 'Basic Information'}
                    </Typography>
                }
                sx={{ p: 3, pb: 0, mb: 2 }}
            />
            <Divider sx={{ mx: 3 }} />
            <CardContent>
                <Grid container spacing={5}>
                    {/* Client ID */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="ClientId"
                            control={control}
                            rules={{ required: dict.client_id_required || 'Client ID is required' }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label={dict.client_id || 'Client ID'}
                                    fullWidth
                                    size="small"
                                    placeholder="e.g. api-wing-1537d672"
                                    slotProps={{
                                        htmlInput: { maxLength: 64 },
                                        inputLabel: { sx: labelSx }
                                    }}
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message || ''}
                                />
                            )}
                        />
                    </Grid>

                    {/* Display Name */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="DisplayName"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label={dict.display_name || 'Display Name'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Description */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="Description"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label={dict.description || 'Description'}
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* BIC Code */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="BICCode"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    label={dict.biccd || 'BIC Code'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Expired On */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="ExpiredOnUtc"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    type="datetime-local"
                                    label={dict.expired_on_utc || 'Expired On (UTC)'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { shrink: true, sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Is Active */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="IsActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!field.value}
                                            onChange={(_, v) => field.onChange(v)}
                                            color="primary"
                                        />
                                    }
                                    label={field.value ? (dict.status_active || 'Active') : (dict.status_inactive || 'InActive')}
                                    sx={{ '& .MuiFormControlLabel-label': { color: 'primary.main', fontWeight: 600 } }}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}
