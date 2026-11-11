'use client'

import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'

import type { ResidentDictionary } from '../resident-list/residentListHelpers'
import { residentText } from '../resident-list/residentListHelpers'
import type { WorkflowErrorPresentation } from '@/shared/utils/workflowError'

type Props = {
    dictionary: ResidentDictionary
    state: 'not-found' | 'error'
    error: WorkflowErrorPresentation | null
    backHref: string
    retrying: boolean
    onRetry: () => void
}

const ResidentDetailLoadState = ({ dictionary, state, error, backHref, retrying, onRetry }: Props) => {
    const isNotFound = state === 'not-found'
    const reference = error?.executionId ?? ''
    const copyReference = () => { if (reference && typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(reference) }

    return (
        <Paper sx={{ px: { xs: 2, sm: 5 }, py: { xs: 5, sm: 8 }, textAlign: 'center', borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack alignItems="center" spacing={2}>
                {isNotFound ? <PersonOffOutlinedIcon color="disabled" sx={{ fontSize: 52 }} /> : <ErrorOutlineOutlinedIcon color="error" sx={{ fontSize: 52 }} />}
                <Stack spacing={1} alignItems="center" sx={{ maxWidth: 560 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{residentText(dictionary, isNotFound ? 'detail_not_found_title' : 'detail_load_error_title', isNotFound ? 'Không tìm thấy hồ sơ cư dân' : 'Không thể tải thông tin cư dân')}</Typography>
                    <Typography color="text.secondary">{residentText(dictionary, isNotFound ? 'detail_not_found_description' : 'detail_load_error_description', isNotFound ? 'Hồ sơ này không tồn tại hoặc đã được xóa. Vui lòng quay lại danh sách cư dân và chọn lại.' : 'Không thể tải thông tin cư dân. Vui lòng thử lại sau.')}</Typography>
                </Stack>
                {reference && <Stack direction="row" alignItems="center" justifyContent="center" gap={0.25} sx={{ maxWidth: '100%', color: 'text.secondary' }}><Tooltip title={reference}><Typography variant="caption" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{residentText(dictionary, isNotFound ? 'detail_not_found_reference' : 'detail_load_error_reference', isNotFound ? 'Mã tra cứu' : 'Mã tra cứu')}: {reference}</Typography></Tooltip><Tooltip title={residentText(dictionary, 'detail_copy_reference', 'Sao chép')}><IconButton size="small" onClick={copyReference} aria-label={residentText(dictionary, 'detail_copy_reference', 'Sao chép')}><ContentCopyOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip></Stack>}
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="center">
                    {!isNotFound && <Button variant="outlined" onClick={onRetry} disabled={retrying}>{retrying ? residentText(dictionary, 'detail_retrying', 'Đang tải lại') : residentText(dictionary, 'detail_retry', 'Thử lại')}</Button>}
                    <Button component={Link} href={backHref} variant="contained">{residentText(dictionary, isNotFound ? 'detail_not_found_back' : 'detail_load_error_back', 'Quay lại danh sách cư dân')}</Button>
                </Stack>
            </Stack>
        </Paper>
    )
}

export default ResidentDetailLoadState
