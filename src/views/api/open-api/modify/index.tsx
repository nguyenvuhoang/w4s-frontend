'use client'

import { Locale } from '@/configs/i18n'
import { PageContentProps, ResponseDefaultData } from '@/types'
import { OpenAPIType } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import ContentWrapper from '@/views/components/layout/content-wrapper'

import ApiIcon from '@mui/icons-material/Api'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import SaveIcon from '@mui/icons-material/Save'
import KeyIcon from '@mui/icons-material/VpnKey'

import {
    Box,
    Button,
    Card, CardContent, CardHeader,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    InputAdornment,
    MenuItem,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

// hooks & utils
import { systemServiceApi } from '@/servers/system-service'
import useOpenApiView from '@/services/useOpenApiView'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import { Session } from 'next-auth'

type PageProps = PageContentProps & {
    openAPIdata: ResponseDefaultData<OpenAPIType> | any
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

type FormValues = {
    DisplayName: string
    Environment: string
    Scopes: string[]           // dùng chips
    BICCode: string
    ExpiredOnUtc: string       // datetime-local string
    IsActive: boolean

    // Auth details
    AccessTokenTtlSeconds: number
    AccessTokenMaxTtlSeconds: number
    AccessTokenMaxUses: number | '' | null
    AccessTokenTrustedIPs: string            // csv
    ClientSecretTrustedIPs: string           // csv

    ClientSecretDescription: string
    ClientSecretExpiresOnUtc: string         // datetime-local
}

const ENV_OPTS = ['DEV', 'UAT', 'PROD']

export default function OpenAPIModifyContent({ dictionary, openAPIdata, session, locale }: PageProps) {
    const { client } = useOpenApiView(openAPIdata)
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)
    const [saving, setSaving] = useState(false)
    const [rotating, setRotating] = useState(false)
    const [revoking, setRevoking] = useState(false)
    const [blinkCount, setBlinkCount] = useState(0)
    const [shouldBlink, setShouldBlink] = useState(false)
    const blinkTimer = useRef<NodeJS.Timeout | null>(null)

    // helpers
    const toLocalDT = (iso?: string | null) => {
        if (!iso) return ''
        const d = new Date(iso)
        // datetime-local needs 'YYYY-MM-DDTHH:mm'
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null)

    const defaultValues: FormValues = useMemo(() => ({
        DisplayName: client.DisplayName ?? '',
        Environment: client.Environment ?? 'DEV',
        Scopes: client.Scopes ?? [],
        BICCode: client.BICCode ?? '',
        ExpiredOnUtc: toLocalDT(client.ExpiredOnUtc),
        IsActive: client.IsActive,

        AccessTokenTtlSeconds: client.AccessTokenTtlSeconds ?? 2592000,
        AccessTokenMaxTtlSeconds: client.AccessTokenMaxTtlSeconds ?? 2592000,
        AccessTokenMaxUses: client.AccessTokenMaxUses ?? '',
        AccessTokenTrustedIPs: (client.AccessTokenTrustedIPs ?? []).join(', '),
        ClientSecretTrustedIPs: (client.ClientSecretTrustedIPs ?? []).join(', '),

        ClientSecretDescription: client.ClientSecretDescription ?? '',
        ClientSecretExpiresOnUtc: toLocalDT(client.ClientSecretExpiresOnUtc)
    }), [client])

    const { control, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({ defaultValues })

    // add a simple chips editor via textfield + Enter/Comma
    const addScope = (val: string) => {
        const trimmed = val.trim()
        if (!trimmed) return
        const current = watch('Scopes')
        if (!current.includes(trimmed)) setValue('Scopes', [...current, trimmed])
    }
    const removeScope = (val: string) => {
        const current = watch('Scopes')
        setValue('Scopes', current.filter(x => x !== val))
    }

    // SAVE
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
            id: client.Id,
            client_id: client.ClientId,
            display_name: data.DisplayName,
            environment: data.Environment,
            scopes: (data.Scopes ?? []).join(','),
            bic_code: data.BICCode || '',
            expired_on_utc: fromLocalDT(data.ExpiredOnUtc),
            is_active: data.IsActive,

            access_token_ttl_seconds: Number(data.AccessTokenTtlSeconds),
            access_token_max_ttl_seconds: Number(data.AccessTokenMaxTtlSeconds),
            access_token_max_uses: data.AccessTokenMaxUses === '' ? 0 : Number(data.AccessTokenMaxUses),
            access_token_trusted_ips: data.AccessTokenTrustedIPs || '',
            client_secret_trusted_ips: data.ClientSecretTrustedIPs || '',
            client_secret_description: data.ClientSecretDescription || '',
            client_secret_expires_on_utc: fromLocalDT(data.ClientSecretExpiresOnUtc)
        }

        setSaving(true)
        try {
            const resp = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_OPENAPI_CLIENT_UPDATE',
                input: payload
            })
            if (!isValidResponse(resp) || (resp.payload?.dataresponse?.error?.length ?? 0) > 0) {
                const msg = resp.payload?.dataresponse?.error?.[0]?.info ?? (resp as any)?.message ?? 'Update failed'
                SwalAlert('error', msg, 'center')
                return
            }

            SwalAlert('success', dictionary['common'].datachange.replace('{0}', dictionary['openapi'].title), 'center', true, false, true, () => {
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 300)
                setBlinkCount(0)
                setShouldBlink(true)
            })


        } catch (e: any) {
            SwalAlert('error', e?.message ?? 'Update failed', 'center')
        } finally {
            setSaving(false)
        }
    }

    // ROTATE SECRET
    const handleRotate = async () => {
        setRotating(true)
        try {
            const expiresLocal = getValues('ClientSecretExpiresOnUtc');
            const resp = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_OPENAPI_CLIENT_ROTATE_SECRET',
                input: {
                    client_id: client.ClientId,
                    id: client.Id,
                    description: `Rotate secret for ${client.ClientId}`,
                    client_secret_expires_on_utc: fromLocalDT(expiresLocal)
                }
            })
            if (!isValidResponse(resp) || (resp.payload?.dataresponse?.error?.length ?? 0) > 0) {
                const msg = resp.payload?.dataresponse?.error?.[0]?.info ?? (resp as any)?.message ?? 'Rotate secret failed'
                SwalAlert('error', msg, 'center')
                return
            }

            const secret = resp.payload?.dataresponse?.fo?.[0]?.input?.data as string
            SwalAlert(
                'success',
                `New secret generated:\n${secret}\nCopy it now; it will be hidden later.`,
                'center'
            );

        } catch (e: any) {
            SwalAlert('error', e?.message ?? 'Rotate secret failed', 'center')
        } finally {
            setRotating(false)
        }
    }

    useEffect(() => {
        if (shouldBlink && blinkCount < 6) {
            blinkTimer.current = setTimeout(() => {
                setBlinkCount(prev => prev + 1)
            }, 300)
        }

        if (shouldBlink && blinkCount >= 6) {
            location.reload()
        }

        return () => {
            if (blinkTimer.current) clearTimeout(blinkTimer.current)
        }
    }, [shouldBlink, blinkCount])


    return (
        <ContentWrapper
            title={`${dict.title} - ${dictCommon.modify || 'Modify'}`}
            description={dict.description}
            icon={<ApiIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%', opacity: blinkCount % 2 === 1 ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* ===== Left card: Basic ===== */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                                <CardHeader
                                    title="Basic Information"
                                    sx={{ '& .MuiCardHeader-title': { fontWeight: 700, color: 'primary.main' } }}
                                />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={5}>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                label={dict.client_id || 'Client ID'}
                                                value={client.ClientId || ''}
                                                fullWidth size="small"
                                                slotProps={{
                                                    input: {
                                                        readOnly: true
                                                    }
                                                }}
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
                                                        {ENV_OPTS.map(e => (
                                                            <MenuItem key={e} value={e}>{e}</MenuItem>
                                                        ))}
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
                                                            // @ts-ignore
                                                            addScope((e.target as HTMLInputElement).value)
                                                                // @ts-ignore
                                                                ; (e.target as HTMLInputElement).value = ''
                                                        }
                                                    }}
                                                    sx={{ minWidth: 250 }}
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
                                                        slotProps={{
                                                            inputLabel: {
                                                                shrink: true
                                                            }
                                                        }}
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

                        {/* ===== Right card: Auth details ===== */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                                <CardHeader
                                    title={dict.auth_details || 'Authentication Details'}
                                    sx={{ '& .MuiCardHeader-title': { fontWeight: 700, color: 'primary.main' } }}
                                />
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
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: <InputAdornment position="end">sec</InputAdornment>
                                                            }
                                                        }}
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
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: <InputAdornment position="end">sec</InputAdornment>
                                                            }
                                                        }}
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
                                                        slotProps={{
                                                            inputLabel: {
                                                                shrink: true
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* ===== Actions bar ===== */}
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" gap={2} justifyContent="space-between" flexWrap="wrap" sx={{ mt: 2 }}>
                                <Box display="flex" gap={2}>
                                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>
                                        {dictCommon.save || 'Save'}
                                    </Button>

                                    <Tooltip title="Rotate Secret">
                                        <span>
                                            <Button variant="outlined" startIcon={<KeyIcon />} onClick={handleRotate} disabled={rotating}>
                                                Rotate Secret
                                            </Button>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="View client">
                                        <span>
                                            <Button color="primary" variant="outlined" startIcon={<RemoveRedEyeIcon />} onClick={() => window.open(`/coreapi/open-api/view/${openAPIdata.id}`, '_blank')} disabled={revoking}>
                                                View
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </ContentWrapper>
    )
}
