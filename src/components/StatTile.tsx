import { formatAmount } from "@/utils/formatAmount";
import { Box, Paper, Typography } from "@mui/material";

export const StatTile = ({
    icon,
    label,
    value,
    color = 'primary'
}: {
    icon: React.ReactNode
    label: string
    value: any
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
}) => {
    const num = Number(value);
    const isNum = !Number.isNaN(num);
    const valueColor =
        isNum && num < 0 ? 'error.main' : (color === 'primary' ? 'text.primary' : `${color}.dark`);

    return (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        display: 'grid', placeItems: 'center', bgcolor: `${color}.light`
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: valueColor }}>
                    {isNum ? formatAmount(num) : String(value ?? '-')}
                </Typography>
            </Box>
        </Paper>
    );
};
