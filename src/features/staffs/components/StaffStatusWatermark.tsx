import { Box, Typography } from '@mui/material'

import type { StaffDictionary, StaffStatus } from '../types'
import { staffText } from './staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    status: StaffStatus
    text_namespace?: 'staffs' | 'residents_tenants'
}

// Only 'I' (deactivated) and 'D' (deleted) get a watermark — 'A' (active, the common case) and
// any other status render nothing so the page looks unchanged for a normal, working account.
const StaffStatusWatermark = ({ dictionary, status, text_namespace = 'staffs' }: Props) => {
    if (status !== 'I' && status !== 'D') return null

    const label = status === 'D'
        ? staffText(dictionary, 'watermark_deleted', 'ĐÃ XÓA', text_namespace)
        : staffText(dictionary, 'watermark_inactive', 'NGƯNG HOẠT ĐỘNG', text_namespace)

    return (
        <Box
            aria-hidden="true"
            sx={{
                position: 'absolute',
                inset: 0,
                // Sits above the cards/tabs (which have opaque backgrounds) so the watermark is
                // actually visible bleeding through them, not fully hidden behind solid fills.
                // pointerEvents: 'none' still lets every click/hover pass straight through to the
                // real content underneath, so nothing about interactivity changes.
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                pointerEvents: 'none',
                userSelect: 'none'
            }}
        >
            <Typography
                component="span"
                sx={{
                    fontWeight: 900,
                    fontSize: 'clamp(2rem, 9vw, 6.5rem)',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    letterSpacing: { xs: 2, md: 6 },
                    textAlign: 'center',
                    color: status === 'D' ? 'error.main' : 'text.primary',
                    opacity: 0.06,
                    transform: 'rotate(-20deg)'
                }}
            >
                {label}
            </Typography>
        </Box>
    )
}

export default StaffStatusWatermark
