'use client'

import { Avatar, Box, Card, CardContent, Chip, Divider, Grid, IconButton, Stack, Typography } from '@mui/material'
import ApiIcon from '@mui/icons-material/Api'
import FingerprintIcon from '@mui/icons-material/Fingerprint'
import BadgeIcon from '@mui/icons-material/Badge'
import PublicIcon from '@mui/icons-material/Public'
import DescriptionIcon from '@mui/icons-material/Description'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BarChartIcon from '@mui/icons-material/BarChart'
import HistoryIcon from '@mui/icons-material/History'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import toast from 'react-hot-toast'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { Locale } from '@/configs/i18n'
import { OpenAPIType } from '@/shared/types/systemTypes'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Session } from 'next-auth'
import ViewActions from './ViewActions'

type Props = {
    data: OpenAPIType
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export default function OpenAPIViewContent({ data, dictionary, locale }: Props) {
    if (!data) {
        return (
            <ContentWrapper
                title="OpenAPI Client"
                description="View details"
                icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
                dictionary={dictionary}
            >
                <Box sx={{ my: 5, textAlign: 'center' }}>
                    <Typography color="text.secondary">{dictionary['common']?.nodata || 'No data found'}</Typography>
                </Box>
            </ContentWrapper>
        )
    }

    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, mt: 3 }}>
            <Icon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
            </Typography>
        </Stack>
    )

    const maskSecret = (secret: string) => {
        if (!secret) return '—'
        if (secret.length <= 10) return secret
        return `${secret.substring(0, 6)}...${secret.substring(secret.length - 4)}`
    }

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} ${dictCommon.copysuccess || 'copied'}`)
    }

    const DetailItem = ({ icon: Icon, label, value, color = 'text.primary', canCopy = false, copyValue = '' }: { icon: any, label: string, value: any, color?: string, canCopy?: boolean, copyValue?: string }) => (
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'flex-start' }}>
            <Avatar sx={{ bgcolor: 'action.hover', width: 36, height: 36, mr: 2 }}>
                <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
                    {label}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: color, wordBreak: 'break-all' }}>
                        {value || '—'}
                    </Typography>
                    {canCopy && (value && value !== '—') && (
                        <IconButton size="small" onClick={() => handleCopy(copyValue || value, label)}>
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    )}
                </Stack>
            </Box>
        </Box>
    )

    const statusColors: Record<string, "success" | "warning" | "error" | "default"> = {
        'Active': 'success',
        'InActive': 'warning',
        'Revoked': 'error',
        'Expired': 'error'
    }

    return (
        <ContentWrapper
            title={`${dict.title}`}
            description={dict.description}
            icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 4, width: '100%' }}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                    {/* Header Banner */}
                    <Box sx={{ px: 4, py: 3, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', mr: 2 }}>
                                    <ApiIcon sx={{ fontSize: 32, color: 'white' }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {data.client_name || '—'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {dict.title}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            <Box>
                                <Chip
                                    label={data.status || 'Unknown'}
                                    color={statusColors[data.status] || 'default'}
                                    sx={{ fontWeight: 700, px: 1, borderRadius: 1.5 }}
                                />
                            </Box>
                        </Stack>
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={4}>
                            {/* Left Column: Identifiers & Basics */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <SectionHeader icon={FingerprintIcon} title={dict.details} />
                                <DetailItem canCopy icon={FingerprintIcon} label={dict.client_id} value={data.client_id} />
                                <DetailItem canCopy copyValue={data.client_secret} icon={VpnKeyIcon} label={dict.client_secret || 'Client Secret'} value={maskSecret(data.client_secret)} />
                                <DetailItem icon={BadgeIcon} label={dict.display_name} value={data.client_name} />

                                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'flex-start' }}>
                                    <Avatar sx={{ bgcolor: 'action.hover', width: 36, height: 36, mr: 2 }}>
                                        <PublicIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                            {dict.allowed_ip_addresses}
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                            {data.allowed_ip_addresses ? data.allowed_ip_addresses.split(',').map((ip: string, idx: number) => (
                                                <Chip
                                                    key={idx}
                                                    label={ip.trim()}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', fontWeight: 600 }}
                                                />
                                            )) : <Typography variant="body1" sx={{ fontWeight: 600 }}>—</Typography>}
                                        </Stack>
                                    </Box>
                                </Box>

                                <DetailItem icon={DescriptionIcon} label={dict.description_label || dictCommon.description || 'Description'} value={data.description} />
                            </Grid>

                            {/* Right Column: Ownership & Performance */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <SectionHeader icon={BarChartIcon} title={dict.auth_details} />
                                <DetailItem icon={PersonIcon} label={dict.created_by} value={data.created_by} />
                                <DetailItem icon={CalendarTodayIcon} label={dict.created_on_utc} value={data.created_on_utc ? data.created_on_utc.split('T')[0] : '—'} />
                                <DetailItem icon={AccessTimeIcon} label={dict.last_used_on_utc} value={data.last_used_on_utc ? data.last_used_on_utc.toString().split('T')[0] : '—'} />
                                <DetailItem icon={HistoryIcon} label={dict.expired_on_utc} value={data.expired_on_utc ? data.expired_on_utc.split('T')[0] : '—'} />
                                <DetailItem icon={BarChartIcon} label={dict.usage_count} value={data.usage_count} color="primary.main" />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* Footer Actions */}
                        <Stack direction="row" spacing={2} justifyContent="flex-start">
                            <ViewActions locale={locale} backLabel={dictCommon.back || 'Back'} />
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </ContentWrapper>
    )
}
