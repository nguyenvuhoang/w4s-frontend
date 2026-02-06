import {
    Card, CardContent, CardHeader, Divider, FormControlLabel,
    Grid, MenuItem, Switch, TextField
} from '@mui/material'
import { Control, Controller } from 'react-hook-form'
import { ENV_OPTS, FormValues } from '../types'
import ScopesInput from './ScopesInput'

// Style chung cho label màu primary
const labelSx = { color: 'primary.main', '&.Mui-focused': { color: 'primary.main' } }

type BasicInfoCardProps = {
    control: Control<FormValues>
    scopes: string[]
    onAddScope: (value: string) => void
    onRemoveScope: (value: string) => void
    dict: Record<string, string>
}

export default function BasicInfoCard({
    control,
    scopes,
    onAddScope,
    onRemoveScope,
    dict
}: BasicInfoCardProps) {
    return (
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardHeader
                title="Basic Information"
                sx={{ '& .MuiCardHeader-title': { fontWeight: 700, color: 'primary.main' } }}
            />
            <Divider />
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
                                    label={dict.display_name || 'Display Name'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Environment */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="Environment"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={dict.environment || 'Environment'}
                                    select
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                >
                                    {ENV_OPTS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                </TextField>
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
                                    label={dict.biccd || 'BIC Code'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Scopes */}
                    <Grid size={{ xs: 12 }}>
                        <ScopesInput
                            scopes={scopes}
                            onAdd={onAddScope}
                            onRemove={onRemoveScope}
                            label={dict.scopes || 'Scopes'}
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
                                            checked={field.value}
                                            onChange={(_, v) => field.onChange(v)}
                                            color="primary"
                                        />
                                    }
                                    label={dict.status_active || 'Active'}
                                    sx={{ '& .MuiFormControlLabel-label': { color: 'primary.main' } }}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}
