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
                    {/* Access Token TTL */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="AccessTokenTtlSeconds"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label={dict.access_token_ttl_seconds || 'Access Token TTL (seconds)'}
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

                    {/* Access Token Max TTL */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="AccessTokenMaxTtlSeconds"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label={dict.access_token_max_ttl_seconds || 'Access Token Max TTL (seconds)'}
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

                    {/* Access Token Max Uses */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="AccessTokenMaxUses"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label={dict.access_token_max_uses || 'Access Token Max Number of Uses'}
                                    fullWidth
                                    size="small"
                                    placeholder={dict.not_set || 'Not set'}
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Access Token Trusted IPs */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="AccessTokenTrustedIPs"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={dict.access_token_trusted_ips || 'Access Token Trusted IPs'}
                                    fullWidth
                                    size="small"
                                    placeholder="0.0.0.0, ::"
                                    helperText="Comma-separated list"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Client Secret Trusted IPs */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="ClientSecretTrustedIPs"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={dict.client_secret_trusted_ips || 'Client Secret Trusted IPs'}
                                    fullWidth
                                    size="small"
                                    placeholder="0.0.0.0, ::"
                                    helperText="Comma-separated list"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Secret Description */}
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="ClientSecretDescription"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={dict.client_secret_description || 'Secret Description'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Secret Expires */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="ClientSecretExpiresOnUtc"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="datetime-local"
                                    label={dict.client_secret_expires_on_utc || 'Secret Expires (UTC)'}
                                    fullWidth
                                    size="small"
                                    slotProps={{ inputLabel: { shrink: true, sx: labelSx } }}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}
