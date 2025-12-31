// components/StatusBadge.tsx
'use client';
import { Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const map = {
    A: { icon: <CheckCircleIcon sx={{ fontSize: 20, color: '#4caf50' }} /> },
    P: { icon: <ScheduleIcon sx={{ fontSize: 20, color: '#ff9800' }} /> },
    C: { icon: <CancelIcon sx={{ fontSize: 20, color: '#f44336' }} /> },
    D: { icon: <DeleteForeverIcon sx={{ fontSize: 20, color: '#f44336' }} /> },
    G: { icon: <HourglassTopIcon sx={{ fontSize: 20, color: '#d32f2f' }} /> },
    B: { icon: <LockOutlinedIcon sx={{ fontSize: 20, color: '#9c27b0' }} /> },
    '?': { icon: <HelpOutlineIcon sx={{ fontSize: 20, color: '#9e9e9e' }} /> }
} as const;

export function StatusBadge({ status, caption }: { status?: string; caption?: string }) {
    const key = (status ?? '?').toUpperCase() as keyof typeof map;
    const icon = map[key]?.icon ?? map['?'].icon;
    return (
        <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <span>{caption}</span>
        </Box>
    );
}
