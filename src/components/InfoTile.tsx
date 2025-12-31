import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material"

export const InfoTile = ({
    icon,
    label,
    value,
    copyable = false,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    copyable?: boolean
}) => {
    const isPrimitive = typeof value === 'string' || typeof value === 'number'

    const copy = async () => {
        if (isPrimitive && typeof value === 'string') {
            await navigator.clipboard?.writeText(value)
        } else if (isPrimitive && typeof value === 'number') {
            await navigator.clipboard?.writeText(String(value))
        }
    }

    return (
        <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'grey.100',
                        }}
                    >
                        {icon}
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>

                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ lineHeight: 1.2 }}
                            component={isPrimitive ? 'p' : 'div'}
                        >
                            {isPrimitive ? (value as any) : value}
                        </Typography>
                    </Box>
                </Stack>

                {copyable && isPrimitive && (
                    <IconButton size="small" onClick={copy} aria-label="Copy" title="Copy">
                        <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                )}
            </Stack>
        </Paper>
    )
}
