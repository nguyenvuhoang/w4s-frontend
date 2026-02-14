import {
    Card, CardContent, CardHeader, Divider,
    Grid, InputAdornment, TextField
} from '@mui/material'
import { Control, Controller } from 'react-hook-form'
import { FormValues } from '../types'

// Style chung cho label màu primary
const labelSx = { color: 'primary.main', '&.Mui-focused': { color: 'primary.main' } }

type AuthDetailsCardProps = {
    control: Control<FormValues>
    dict: Record<string, string>
}

export default function AuthDetailsCard({ control, dict }: AuthDetailsCardProps) {
    return (
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardHeader
                title={dict.auth_details || 'Authentication Details'}
                sx={{ '& .MuiCardHeader-title': { fontWeight: 700, color: 'primary.main' } }}
            />
            <Divider />
            <CardContent>
                <Grid container spacing={5}>
                    {/* Client Secret */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="ClientSecret"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={dict.client_secret || 'Client Secret'}
                                    fullWidth
                                    size="small"
                                    type="password"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Access Token TTL */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="AccessTokenTtlSeconds"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label={dict.access_token_ttl_seconds || 'Token Life Time (sec)'}
                                    fullWidth
                                    size="small"
                                    slotProps={{
                                        input: {
                                            endAdornment: <InputAdornment position="end">sec</InputAdornment>
                                        },
                                        inputLabel: { sx: labelSx }
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Refresh Token TTL */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="RefreshTokenLifeTimeInSeconds"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label={dict.refresh_token_ttl_seconds || 'Refresh Token Life Time (sec)'}
                                    fullWidth
                                    size="small"
                                    slotProps={{
                                        input: {
                                            endAdornment: <InputAdornment position="end">sec</InputAdornment>
                                        },
                                        inputLabel: { sx: labelSx }
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Rate Limit Per Minute */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="RateLimitPerMinute"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label={dict.rate_limit_per_minute || 'Rate Limit / Min'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>


                    {/* Access Token Trusted IPs (Allowed IP Addresses) */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="AccessTokenTrustedIPs"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={dict.allowed_ip_addresses || 'Allowed IP Addresses'}
                                    fullWidth
                                    size="small"
                                    placeholder="192.168.1.10,192.168.1.11"
                                    helperText="Comma-separated list"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Deactivated At */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="DeactivatedAt"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="datetime-local"
                                    label={dict.deactivated_at || 'Deactivated At'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { shrink: true, sx: labelSx } }}
                                    value={field.value || ''}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}
