'use client'

import { Locale } from '@/configs/i18n'
import useOpenApiView from '@/services/useOpenApiView'
import { PageContentProps, ResponseDefaultData } from '@/types'
import { OpenAPIType } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import ContentWrapper from '@/views/components/layout/content-wrapper'

import ApiIcon from '@mui/icons-material/Api'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material'
import { Session } from 'next-auth'
import { useState } from 'react'

type PageProps = PageContentProps & {
    openAPIdata: ResponseDefaultData<OpenAPIType> | any
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

const StatusChip = ({ status, dictionary }: { status: string; dictionary: any }) => {
  const statusChipSx = {
    width: 'fit-content',
    height: 22,
    alignSelf: 'flex-start',
    '& .MuiChip-label': { px: 2, fontSize: 12 },
  };

  if (status === 'ACTIVE')
    return (
      <Chip
        size="small"
        color="primary"
        icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
        label={dictionary['openapi'].status_active || 'ACTIVE'}
        variant="filled"
        sx={statusChipSx}
      />
    );

  if (status === 'REVOKED')
    return (
      <Chip
        size="small"
        color="error"
        icon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
        label={dictionary['openapi'].status_revoked || 'REVOKED'}
        variant="filled"
        sx={statusChipSx}
      />
    );

  if (status === 'EXPIRED')
    return (
      <Chip
        size="small"
        color="warning"
        icon={<HourglassTopIcon sx={{ fontSize: 18 }} />}
        label={dictionary['openapi'].status_expired || 'EXPIRED'}
        variant="filled"
        sx={statusChipSx}
      />
    );

  return (
    <Chip
      size="small"
      color="default"
      icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
      label={dictionary['openapi'].status_inactive || 'INACTIVE'}
      variant="outlined"
      sx={statusChipSx}
    />
  );
};


export default function OpenAPIViewContent({ dictionary, openAPIdata }: PageProps) {
    const { client, status, authDetails, secrets, fmtDateTime, copy } = useOpenApiView(openAPIdata)

    const [showSecret, setShowSecret] = useState(false)

    const statusChipSx = {
        width: 'fit-content',
        height: 22,
        alignSelf: 'flex-start',
        '& .MuiChip-label': { px: 2, fontSize: 12 }
    }

    return (
        <ContentWrapper
            title={`${dictionary['openapi'].title} - ${dictionary['common'].view}`}
            description={dictionary['openapi'].description}
            icon={<ApiIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <Grid container spacing={3}>
                    {/* ===== Left: Client Details ===== */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                            <CardHeader
                                title="Client Details"
                                sx={{
                                    '& .MuiCardHeader-title': {
                                        fontWeight: 700,
                                        color: 'primary.main'
                                    }
                                }}
                            />
                            <Divider />
                            <CardContent>
                                <Box display="grid" rowGap={1.5}>
                                    <Typography variant="h6" color="primary">
                                        {dictionary['openapi'].client_id}
                                    </Typography>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                            {client.ClientId}
                                        </Typography>
                                        <Tooltip title="Copy Client ID">
                                            <IconButton size="small" onClick={() => copy(client.ClientId)}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                        {dictionary['openapi'].display_name}
                                    </Typography>
                                    <Typography variant="body1">{client.DisplayName ?? '-'}</Typography>

                                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                        {dictionary['openapi'].environment}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={client.Environment ?? '-'}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ width: 'fit-content' }}
                                    />

                                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                        {dictionary['openapi'].status}
                                    </Typography>
                                    <StatusChip status={status} dictionary={dictionary} />
									
									<Typography
										variant="h6"
										color="text.secondary"
										sx={{ mt: 2 }}
									>
									{dictionary["openapi"].is_revoked}
									  </Typography>
									  <Typography variant="body2" color="text.secondary">
										{client.IsRevoked ? (
										  <FiberManualRecordIcon
											sx={{ fontSize: 14, color: "red" }}
										  />
										) : (
										  <FiberManualRecordIcon
											sx={{ fontSize: 14, color: "green" }}
										  />
										)}
									  </Typography>

                                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                        {dictionary['openapi'].scopes}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {client.Scopes?.length
                                            ? client.Scopes.map((s: string, i: number) => (
                                                <Chip key={`${s}-${i}`} size="small" label={s} />
                                            ))
                                            : '-'}
                                    </Box>

                                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                        {dictionary['openapi'].biccd}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {client.BICCode ?? '-'}
                                    </Typography>

                                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                        {dictionary['openapi'].client_secret}
                                    </Typography>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="h6" sx={{ wordBreak: 'break-all' }}>
                                            {showSecret ? client.ClientSecret : '•'.repeat(12)}
                                        </Typography>
                                        <Box>
                                            <Tooltip title={showSecret ? 'Hide' : 'Show'}>
                                                <IconButton size="small" onClick={() => setShowSecret(v => !v)}>
                                                    {showSecret ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Copy Secret">
                                                <IconButton size="small" onClick={() => copy(client.ClientSecret)}>
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ===== Right: Properties table ===== */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                            <CardHeader
                                title="Authentication Details"
                                sx={{
                                    '& .MuiCardHeader-title': {
                                        fontWeight: 700,
                                        color: 'primary.main'
                                    }
                                }}
                            />
                            <Divider />

                            <CardContent>
                                {/* Details */}
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                    {dictionary['openapi'].auth_details}
                                </Typography>

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {dictionary['openapi'].access_token_ttl_seconds}
                                        </Typography>
                                        <Typography variant="body1">{authDetails.accessTokenTtl}</Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {dictionary['openapi'].access_token_max_ttl_seconds}
                                        </Typography>
                                        <Typography variant="body1">{authDetails.accessTokenMaxTtl}</Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {dictionary['openapi'].access_token_max_uses}
                                        </Typography>
                                        <Typography variant="body1">
                                            {authDetails.accessTokenMaxUses ?? <i>Not set</i>}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {dictionary['openapi'].access_token_trusted_ips}
                                        </Typography>
                                        <Typography variant="body1">
                                            {authDetails.accessTokenTrustedIps.join(', ')}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {dictionary['openapi'].client_secret_trusted_ips}
                                        </Typography>
                                        <Typography variant="body1">
                                            {authDetails.clientSecretTrustedIps.join(', ')}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                {/* Client ID */}
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                    {dictionary['openapi'].client_id}
                                </Typography>
                                <Box
                                    sx={{
                                        p: 1.25,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 2
                                    }}
                                >
                                    <Typography sx={{ wordBreak: 'break-all' }}>{client.ClientId}</Typography>
                                    <Tooltip title="Copy Client ID">
                                        <IconButton size="small" onClick={() => navigator.clipboard.writeText(client.ClientId as string)}>
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {/* Client Secrets */}
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                    {dictionary['openapi'].client_secrets}
                                </Typography>

                                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>{dictionary['openapi'].client_secrets}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{dictionary['openapi'].description_label}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{dictionary['openapi'].number_of_uses}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{dictionary['openapi'].expires}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {secrets.map(s => (
                                                <TableRow key={s.id}>
                                                    <TableCell>{s.masked}</TableCell>
                                                    <TableCell>{s.description}</TableCell>
                                                    <TableCell>{s.uses}</TableCell>
                                                    <TableCell>{fmtDateTime(s.expires)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {`1 - ${secrets.length} of ${secrets.length}`}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>
            </Box>
        </ContentWrapper>
    )
}
