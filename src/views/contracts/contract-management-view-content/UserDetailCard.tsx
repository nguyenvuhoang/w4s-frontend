'use client'

import Spinner from '@/components/spinners'
import { fmtDt } from '@/utils/fmtDt'
import { getDictionary } from '@/utils/getDictionary'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DoNotDisturbOnRoundedIcon from '@mui/icons-material/DoNotDisturbOnRounded'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import FemaleIcon from '@mui/icons-material/Female'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MaleIcon from '@mui/icons-material/Male'
import { Box, Chip, Divider, IconButton, Tooltip, Typography, Grid } from '@mui/material'
import * as React from 'react'

type UserDetail = Record<string, any>

export type UserDetailCardProps = {
    data?: UserDetail | null
    loading?: boolean
    error?: string
    onRetry?: () => void
    title?: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const mapGender = (g: any) => {
    const v = String(g ?? '').trim().toLowerCase()

    if (v === '1' || v === 'm' || v === 'male') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MaleIcon color="primary" fontSize="small" />
                <Typography component="span">Male</Typography>
            </Box>
        )
    }

    if (v === '0' || v === 'f' || v === 'female') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FemaleIcon color="secondary" fontSize="small" />
                <Typography component="span">Female</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HelpOutlineIcon fontSize="small" color="disabled" />
            <Typography component="span">{g || '-'}</Typography>
        </Box>
    )
}

const StatusChip = ({ code, caption }: { code?: any; caption?: any }) => {
    const isActive = String(code ?? '').toUpperCase() === 'A' || String(caption ?? '').toLowerCase() === 'active'
    return (
        <Chip
            size="small"
            icon={isActive ? <CheckCircleRoundedIcon /> : <DoNotDisturbOnRoundedIcon color='error' />}
            label={caption || (isActive ? 'Active' : 'Inactive')}
            color={isActive ? 'primary' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    )
}

const DetailRow = ({
    label,
    value,
    copyable = false,
    copyText
}: {
    label: string
    value: React.ReactNode
    copyable?: boolean
    copyText?: string | number | null
}) => {
    const isPrimitive =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

    const fallbackCopy = isPrimitive ? String(value) : ''
    const textToCopy = (copyText ?? fallbackCopy) as string
    const canCopy = copyable && !!textToCopy

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy)
        } catch { }
    }

    return (
        <Grid size={{ xs: 12, sm: 6 }}>
            <Box className="flex items-start gap-3">
                <Typography component="span" sx={{ minWidth: 160 }} className="text-gray-500">
                    {label}
                </Typography>

                <Box className="flex items-center gap-1">
                    {isPrimitive ? (
                        <Typography component="span" className="font-medium break-all">
                            {value === '' ? '-' : String(value)}
                        </Typography>
                    ) : (
                        <Box className="font-medium break-all">{value ?? '-'}</Box>
                    )}

                    {canCopy && (
                        <Tooltip title="Copy">
                            <IconButton onClick={handleCopy} size="small" aria-label="copy">
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </Grid>
    )
}

export default function UserDetailCard({ data, loading, error, onRetry, title = 'User Detail', dictionary }: UserDetailCardProps) {
    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <Spinner />
                <Typography>Loading...</Typography>
            </Box>
        )
    }

    if (error) {
        return (
            <Box
                sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}
            >
                <ErrorOutlineIcon color="error" sx={{ fontSize: 52, mb: 1 }} />
                <Typography variant="body1" color="error" fontWeight="medium" sx={{ mb: 1 }}>
                    {error}
                </Typography>
                {onRetry && <Chip label="Retry" variant="outlined" color="primary" onClick={onRetry} />}
            </Box>
        )
    }

    if (!data || Object.keys(data).length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography className="text-gray-500">No details</Typography>
            </Box>
        )
    }

    const d = data

    return (
        <Box sx={{ p: 2 }}>
            <Box className="flex items-center gap-2 mb-2">
                <InfoOutlinedIcon />
                <Typography variant="subtitle1" className="font-semibold">
                    {title}
                </Typography>
                <Box sx={{ ml: 1 }}>
                    <StatusChip code={d.status} caption={d.statuscaption} />
                </Box>
            </Box>
            <Divider className="mb-3" />

            <Grid container spacing={2}>
                {/* Trái */}
                <DetailRow label={dictionary['common'].channel} value={d.channelid ?? '-'} />
                <DetailRow label={dictionary['coresession'].userid} value={d.userid ?? '-'} copyable copyText={d.userid} />
                <DetailRow label={dictionary['common'].usercode} value={d.usercode ?? '-'} copyable copyText={d.usercode} />
                <DetailRow label={dictionary['common'].loginname} value={d.loginname ?? '-'} copyable copyText={d.loginname} />
                <DetailRow label={dictionary['common'].username} value={d.username ?? '-'} />
                <DetailRow label={dictionary['common'].fullname} value={d.lastname ?? '-'} />
                <DetailRow label={dictionary['customer'].gender} value={mapGender(d.gender)} />
                <DetailRow label={dictionary['customer'].address} value={d.address ?? '-'} />
                <DetailRow label={dictionary['auth'].email} value={d.email ?? '-'} />
                <DetailRow label={dictionary['contract'].birthday} value={fmtDt(d.birthday) ?? '-'} />
                <DetailRow label={dictionary['common'].lastlogin} value={fmtDt(d.lastlogintime) ?? '-'} />

                {/* Phải */}
                <DetailRow
                    label={dictionary['common'].islogin}
                    value={
                        d.islogin
                            ? <CheckCircleRoundedIcon color="success" fontSize="small" />
                            : <DoNotDisturbOnRoundedIcon color="error" fontSize="small" />
                    }
                />
                <DetailRow label={dictionary['customer'].userlevel} value={d.userlevel ?? '-'} />
                <DetailRow label={dictionary['customer'].usertype} value={d.usertype ?? '-'} />
                <DetailRow label={dictionary['customer'].policyid} value={d.policyid ?? '-'} />
                <DetailRow label={dictionary['customer'].branchid} value={d.branchid ?? '-'} />
                <DetailRow label={dictionary['customer'].failnumber} value={d.failnumber ?? '-'} />
                <DetailRow label={dictionary['customer'].updatedonutc} value={fmtDt(d.updatedonutc) ?? '-'} />
                <DetailRow label={dictionary['customer'].createdonutc} value={fmtDt(d.createdonutc) ?? '-'} />
                <DetailRow label={dictionary['customer'].phone} value={d.phone ?? '-'} />
                <DetailRow label={dictionary['customer'].contractnumber} value={d.contractnumber ?? '-'} copyable copyText={d.contractnumber} />
                <DetailRow label={dictionary['customer'].session} value={d.session ?? '-'} copyable copyText={d.session} />
            </Grid>
        </Box>
    )
}
