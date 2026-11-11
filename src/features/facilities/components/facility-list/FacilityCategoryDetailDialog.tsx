import CategoryIcon from '@mui/icons-material/Category'
import CloseIcon from '@mui/icons-material/Close'
import {
    Alert,
    Avatar,
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Skeleton,
    Stack,
    Typography
} from '@mui/material'
import type { ReactNode } from 'react'

import type { FacilitiesDictionary, FacilityCategoryDetail } from '../../types'
import {
    commonText,
    facilitiesText,
    formatNullableNumber,
    getFacilityStatusColor,
    getFacilityStatusLabel
} from './facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    open: boolean
    loading: boolean
    error: string | null
    detail: FacilityCategoryDetail | null
    on_close: () => void
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1.5, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
            {label}
        </Typography>
        <Box>{children}</Box>
    </Box>
)

const FacilityCategoryDetailDialog = ({ dictionary, open, loading, error, detail, on_close }: Props) => (
    <Dialog open={open} onClose={on_close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
            {facilitiesText(dictionary, 'category_detail_title', 'Facility Category Detail')}
            <IconButton
                aria-label={commonText(dictionary, 'close', 'Close')}
                onClick={on_close}
                sx={{ position: 'absolute', right: 12, top: 10 }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            {loading ? (
                <Stack spacing={2}>
                    {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} height={32} />)}
                </Stack>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : detail ? (
                <Stack spacing={2.25}>
                    <DetailRow label={facilitiesText(dictionary, 'field_category_code', 'Category Code')}>
                        <Typography sx={{ fontWeight: 800 }}>{detail.category_code || '-'}</Typography>
                    </DetailRow>
                    <DetailRow label={facilitiesText(dictionary, 'project_id', 'Project ID')}>
                        <Typography>{formatNullableNumber(detail.project_id)}</Typography>
                    </DetailRow>
                    <DetailRow label={facilitiesText(dictionary, 'field_category_name', 'Category Name')}>
                        <Typography>{detail.name || '-'}</Typography>
                    </DetailRow>
                    <DetailRow label={facilitiesText(dictionary, 'field_icon', 'Icon')}>
                        {detail.icon_url ? (
                            <Avatar src={detail.icon_url} variant="rounded" sx={{ width: 42, height: 42 }}>
                                <CategoryIcon fontSize="small" />
                            </Avatar>
                        ) : (
                            <Typography color="text.secondary">-</Typography>
                        )}
                    </DetailRow>
                    <DetailRow label={facilitiesText(dictionary, 'field_display_order', 'Display Order')}>
                        <Typography>{formatNullableNumber(detail.display_order)}</Typography>
                    </DetailRow>
                    <DetailRow label={facilitiesText(dictionary, 'field_status', 'Status')}>
                        <Chip
                            size="small"
                            color={getFacilityStatusColor(detail.status)}
                            label={getFacilityStatusLabel(dictionary, detail.status)}
                        />
                    </DetailRow>
                </Stack>
            ) : (
                <Typography color="text.secondary">-</Typography>
            )}
        </DialogContent>
    </Dialog>
)

export default FacilityCategoryDetailDialog
