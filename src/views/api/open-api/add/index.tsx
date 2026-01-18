'use client'

import { Locale } from '@/configs/i18n'
import { PageContentProps } from '@/types'
import { getDictionary } from '@/utils/getDictionary'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'

import ApiIcon from '@mui/icons-material/Api'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'

import {
    Box, Button, Card, CardContent, CardHeader, Chip, Divider, FormControlLabel,
    Grid,
    InputAdornment, MenuItem, Switch, TextField, Tooltip, Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { systemServiceApi } from '@/servers/system-service'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'

type PageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

type FormValues = {
    ClientId: string
    DisplayName: string
    Environment: 'DEV' | 'UAT' | 'PROD'
    Scopes: string[]          // chips
    BICCode: string
    ExpiredOnUtc: string      // datetime-local
    IsActive: boolean

    AccessTokenTtlSeconds: number
    AccessTokenMaxTtlSeconds: number
    AccessTokenMaxUses: number | '' | null
    AccessTokenTrustedIPs: string
    ClientSecretTrustedIPs: string

    ClientSecretDescription: string
    ClientSecretExpiresOnUtc: string
}

const ENV_OPTS: Array<'DEV' | 'UAT' | 'PROD'> = ['DEV', 'UAT', 'PROD']

export default function OpenAPIAddContent({ dictionary, session, locale }: PageProps) {
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)
    const [saving, setSaving] = useState(false)


    const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null)

    const defaultValues: FormValues = useMemo(() => ({
        ClientId: '',
        DisplayName: '',
        Environment: 'DEV',
        Scopes: [],
        BICCode: '',
        // để trống hoặc đặt mặc định +1 năm:
        ExpiredOnUtc: '',
        IsActive: true,

        AccessTokenTtlSeconds: 2_592_000,
        AccessTokenMaxTtlSeconds: 2_592_000,
        AccessTokenMaxUses: '',
        AccessTokenTrustedIPs: '0.0.0.0, ::',
        ClientSecretTrustedIPs: '0.0.0.0, ::',

        ClientSecretDescription: '',
        ClientSecretExpiresOnUtc: ''
    }), [])

    const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({ defaultValues })

    const addScope = (val: string) => {
        const trimmed = val.trim()
        if (!trimmed) return
        const current = watch('Scopes')
        if (!current.includes(trimmed)) setValue('Scopes', [...current, trimmed])
    }
    const removeScope = (val: string) => setValue('Scopes', (watch('Scopes') || []).filter(x => x !== val))

    const onSubmit = async (data: FormValues) => {
        // validations
        if (data.AccessTokenTtlSeconds <= 0) {
            SwalAlert('error', 'TTL must be > 0', 'center'); return
        }
        if (data.AccessTokenMaxTtlSeconds < data.AccessTokenTtlSeconds) {
            SwalAlert('error', 'Max TTL must be ≥ TTL', 'center'); return
        }
        if (data.AccessTokenMaxUses !== '' && Number(data.AccessTokenMaxUses) < 0) {
            SwalAlert('error', 'Max uses must be ≥ 0', 'center'); return
        }

        const payload = {
            client_id: data.ClientId,
            display_name: data.DisplayName,
            environment: data.Environment,
            scopes: (data.Scopes ?? []).join(','),
            bic_code: data.BICCode || null,
            expired_on_utc: fromLocalDT(data.ExpiredOnUtc),
            is_active: data.IsActive,

            access_token_ttl_seconds: Number(data.AccessTokenTtlSeconds),
            access_token_max_ttl_seconds: Number(data.AccessTokenMaxTtlSeconds),
            access_token_max_uses: data.AccessTokenMaxUses === '' ? 0 : Number(data.AccessTokenMaxUses),
            access_token_trusted_ips: data.AccessTokenTrustedIPs || null,
            client_secret_trusted_ips: data.ClientSecretTrustedIPs || null,
            client_secret_description: data.ClientSecretDescription || null,
            client_secret_expires_on_utc: fromLocalDT(data.ClientSecretExpiresOnUtc)
        }

        setSaving(true)
        try {
            const resp = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_OPENAPI_CLIENT_CREATE',
                input: payload
            })
            if (!isValidResponse(resp) || (resp.payload?.dataresponse?.error?.length ?? 0) > 0) {
                const msg = resp.payload?.dataresponse?.error?.[0]?.info ?? (resp as any)?.message ?? 'Create client failed'
                SwalAlert('error', msg, 'center')
                return
            }

            const fo0 = resp.payload.dataresponse.fo?.[0]?.input ?? {}
            const clientId = fo0.client_id || fo0.ClientId
            const clientSecret = (fo0.secret || fo0.client_secret || '').toString()

            SwalAlert(
                'success',
                `Client created:\nID: ${clientId}\nSecret: ${clientSecret}\nCopy it now; it will be hidden later.`,
                'center',
                true,
                false,
                true,
                () => {
                    reset(defaultValues)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }
            )
        } catch (e: any) {
            SwalAlert('error', e?.message ?? 'Create client failed', 'center')
        } finally {
            setSaving(false)
        }
    }

    return (
        <ContentWrapper
            title={`${dict.title} - ${dictCommon.add || 'Add'}`}
            description={dict.description}
            icon={<ApiIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* ===== Left: Basic ===== */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                                <CardHeader title="Basic Information" sx={{ '& .MuiCardHeader-title': { fontWeight: 700, color: 'primary.main' } }} />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={5}>

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
                                                        slotProps={{ htmlInput: { maxLength: 64 } }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message || ''}
                                                    />
                                                )}
                                            />
                                        </Grid>


                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="DisplayName"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField {...field} label={dict.display_name || 'Display Name'} fullWidth size="small" />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="Environment"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField {...field} label={dict.environment || 'Environment'} select fullWidth size="small">
                                                        {ENV_OPTS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                                    </TextField>
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="BICCode"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField {...field} label={dict.biccd || 'BIC Code'} fullWidth size="small" />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                                {dict.scopes || 'Scopes'}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                                                {(watch('Scopes') || []).map(s => (
                                                    <Chip key={s} size="small" label={s} onDelete={() => removeScope(s)} />
                                                ))}
                                                <TextField
                                                    size="small"
                                                    placeholder="Add scope… (press Enter)"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' || e.key === ',') {
                                                            e.preventDefault()
                                                            addScope((e.target as HTMLInputElement).value)
                                                                ; (e.target as HTMLInputElement).value = ''
                                                        }
                                                    }}
                                                    sx={{ minWidth: 220 }}
                                                />
                                            </Box>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="ExpiredOnUtc"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        type="datetime-local"
                                                        label={dict.expired_on_utc || 'Expired On (UTC)'}
                                                        fullWidth size="small"
                                                        slotProps={{ inputLabel: { shrink: true } }}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="IsActive"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                                                        label={dict.status_active || 'Active'}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* ===== Right: Auth details ===== */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                                <CardHeader title={dict.auth_details || 'Authentication Details'} sx={{ '& .MuiCardHeader-title': { fontWeight: 700, color: 'primary.main' } }} />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={5}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="AccessTokenTtlSeconds"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        type="number"
                                                        label={dict.access_token_ttl_seconds || 'Access Token TTL (seconds)'}
                                                        fullWidth size="small"
                                                        slotProps={{ input: { endAdornment: <InputAdornment position="end">sec</InputAdornment> } }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="AccessTokenMaxTtlSeconds"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        type="number"
                                                        label={dict.access_token_max_ttl_seconds || 'Access Token Max TTL (seconds)'}
                                                        fullWidth size="small"
                                                        slotProps={{ input: { endAdornment: <InputAdornment position="end">sec</InputAdornment> } }}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="AccessTokenMaxUses"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        type="number"
                                                        label={dict.access_token_max_uses || 'Access Token Max Number of Uses'}
                                                        fullWidth size="small"
                                                        placeholder={dict.not_set || 'Not set'}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="AccessTokenTrustedIPs"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label={dict.access_token_trusted_ips || 'Access Token Trusted IPs'}
                                                        fullWidth size="small"
                                                        placeholder="0.0.0.0, ::"
                                                        helperText="Comma-separated list"
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="ClientSecretTrustedIPs"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label={dict.client_secret_trusted_ips || 'Client Secret Trusted IPs'}
                                                        fullWidth size="small"
                                                        placeholder="0.0.0.0, ::"
                                                        helperText="Comma-separated list"
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="ClientSecretDescription"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label={dict.client_secret_description || 'Secret Description'}
                                                        fullWidth size="small"
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="ClientSecretExpiresOnUtc"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        type="datetime-local"
                                                        label={dict.client_secret_expires_on_utc || 'Secret Expires (UTC)'}
                                                        fullWidth size="small"
                                                        slotProps={{ inputLabel: { shrink: true } }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* ===== Actions ===== */}
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" gap={2} justifyContent="flex-start" sx={{ mt: 2 }}>
                                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>
                                    {dictCommon.save || 'Save'}
                                </Button>

                                <Tooltip title="Reset form">
                                    <span>
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            color="inherit"
                                            startIcon={<RestartAltIcon />}
                                            onClick={() => reset(defaultValues)}
                                            disabled={saving}
                                        >
                                            {dictCommon.reset || 'Reset'}
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </ContentWrapper>
    )
}
