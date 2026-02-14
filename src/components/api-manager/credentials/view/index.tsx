import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, Card, CardContent, CardHeader, Chip, Divider, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { Locale } from '@/configs/i18n'
import { OpenAPIType } from '@/shared/types/systemTypes'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Session } from 'next-auth'
import ApiIcon from '@mui/icons-material/Api'

import { getLocalizedUrl } from '@/shared/utils/i18n'

type Props = {
    data: OpenAPIType
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export default function OpenAPIViewContent({ data, dictionary, locale }: Props) {
    const router = useRouter()
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)

    const handleBack = () => router.push(getLocalizedUrl('/api-manager/credentials/', locale as Locale))

    const InfoItem = ({ label, value }: { label: string, value: any }) => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
                {value || '—'}
            </Typography>
        </Box>
    )

    return (
        <ContentWrapper
            title={`${dict.title} - ${dictCommon.view || 'View'}`}
            description={dict.description}
            icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <Grid container spacing={3}>
                    {/* Basic Info */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardHeader title={dict.details || 'Basic Information'} />
                            <Divider />
                            <CardContent>
                                <InfoItem label={dict.client_id} value={data.client_id} />
                                <InfoItem label={dict.display_name} value={data.client_name} />
                                <InfoItem label={dict.status} value={data.status} />
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        {dict.allowed_ip_addresses}
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {data.allowed_ip_addresses ? data.allowed_ip_addresses.split(',').map((ip, idx) => (
                                            <Chip
                                                key={idx}
                                                label={ip.trim()}
                                                size="small"
                                                variant="outlined"
                                                sx={{ borderColor: '#0C9150', color: '#0C9150' }}
                                            />
                                        )) : '—'}
                                    </Box>
                                </Box>
                                <InfoItem label={dict.description} value={data.description} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Auth Details / Metadata */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardHeader title={dict.auth_details || 'Creation & Usage'} />
                            <Divider />
                            <CardContent>
                                <InfoItem label={dict.created_by} value={data.created_by} />
                                <InfoItem label={dict.created_on_utc} value={data.created_on_utc ? data.created_on_utc.split('T')[0] : '—'} />
                                <InfoItem label={dict.expired_on_utc} value={data.expired_on_utc ? data.expired_on_utc.split('T')[0] : '—'} />
                                <InfoItem label={dict.last_used_on_utc} value={data.last_used_on_utc ? data.last_used_on_utc.toString().split('T')[0] : '—'} />
                                <InfoItem label={dict.usage_count} value={data.usage_count} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Footer Actions */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<ArrowBackIcon />}
                                onClick={handleBack}
                            >
                                {dictCommon.back || 'Back'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </ContentWrapper>
    )
}
