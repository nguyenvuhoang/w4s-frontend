'use client'

import HistoryIcon from '@mui/icons-material/History'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'

import type { ServiceRequestStatusLog, ServiceRequestsDictionary } from '../types'
import {
    displayText,
    formatServiceRequestDateTime,
    getRequestStatusColor,
    getRequestStatusLabel,
    serviceRequestsText
} from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    locale: string
    statusLogs: ServiceRequestStatusLog[]
}

const EmptyStatusLogs = ({ dictionary }: { dictionary: ServiceRequestsDictionary }) => (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 4, color: 'text.secondary' }}>
        <InfoOutlinedIcon />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {serviceRequestsText(dictionary, 'no_status_logs')}
        </Typography>
    </Stack>
)

const ServiceRequestStatusLogsSection = ({ dictionary, locale, statusLogs }: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" gap={1}>
                <HistoryIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {serviceRequestsText(dictionary, 'status_tracking')}
                </Typography>
            </Stack>
            <Divider />

            {statusLogs.length === 0 ? (
                <EmptyStatusLogs dictionary={dictionary} />
            ) : (
                <Stack spacing={1.5}>
                    {statusLogs.map((log, index) => (
                        <Paper key={`${log.changed_on_utc ?? 'status'}-${index}`} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                            <Stack spacing={1.25}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={getRequestStatusColor(log.from_status)}
                                            label={`${serviceRequestsText(dictionary, 'from_status')}: ${getRequestStatusLabel(dictionary, log.from_status)}`}
                                        />
                                        <Box component="span" sx={{ color: 'text.disabled' }}>-&gt;</Box>
                                        <Chip
                                            size="small"
                                            color={getRequestStatusColor(log.to_status)}
                                            label={`${serviceRequestsText(dictionary, 'to_status')}: ${getRequestStatusLabel(dictionary, log.to_status)}`}
                                        />
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                        {serviceRequestsText(dictionary, 'changed_on_utc')}: {formatServiceRequestDateTime(log.changed_on_utc, locale)}
                                    </Typography>
                                </Stack>

                                <Stack spacing={0.5}>
                                    <Typography variant="body2" color="text.secondary">
                                        {serviceRequestsText(dictionary, 'changed_by_user_code')}: {displayText(log.changed_by_user_code)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {serviceRequestsText(dictionary, 'status_log_note')}: {displayText(log.note)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Stack>
    </Paper>
)

export default ServiceRequestStatusLogsSection
