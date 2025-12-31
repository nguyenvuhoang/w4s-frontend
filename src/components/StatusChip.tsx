import { Chip } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import BlockIcon from '@mui/icons-material/Block'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
export const StatusChip = ({ caption }: { caption?: string }) => {
    const raw = String(caption ?? '').trim()
    const vLower = raw.toLowerCase()
    const vUpper = raw.toUpperCase()

    let color: 'primary' | 'default' | 'success' | 'warning' | 'error' | 'info' = 'default'
    let label = raw || '-'
    let icon: React.ReactNode | undefined

    if (vUpper.length === 1) {
        switch (vUpper) {
            case 'N':
            case 'A':
                color = 'primary'
                label = 'Normal'
                icon = <CheckCircleRoundedIcon fontSize="small" />
                break
            case 'P':
                color = 'warning'
                label = 'Pending'
                icon = <HourglassTopIcon fontSize="small" />
                break
            case 'C':
                color = 'error'
                label = 'Closed'
                icon = <BlockIcon fontSize="small" />
                break
            default:
                color = 'info'
                icon = <HelpOutlineIcon fontSize="small" />
                break
        }
    } else {
        if (['normal', 'active', 'enable'].includes(vLower)) {
            color = 'primary'
            label = 'Normal'
            icon = <CheckCircleRoundedIcon fontSize="small" />
        } else if (['pending', 'hold', 'frozen', 'processing'].includes(vLower)) {
            color = 'warning'
            label = 'Pending'
            icon = <HourglassTopIcon fontSize="small" />
        } else if (['closed', 'inactive', 'blocked', 'cancelled', 'canceled'].includes(vLower)) {
            color = 'error'
            label = 'Closed'
            icon = <BlockIcon fontSize="small" />
        } else {
            color = 'info'
            icon = <HelpOutlineIcon fontSize="small" />
        }
    }

    return <Chip size="small" color={color} label={label} variant="outlined" icon={icon} />
}
