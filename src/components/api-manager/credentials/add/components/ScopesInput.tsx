import { Box, Chip, TextField, Typography } from '@mui/material'

type ScopesInputProps = {
    scopes: string[]
    onAdd: (value: string) => void
    onRemove: (value: string) => void
    label?: string
}

export default function ScopesInput({ scopes, onAdd, onRemove, label = 'Scopes' }: ScopesInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const input = e.target as HTMLInputElement
            onAdd(input.value)
            input.value = ''
        }
    }

    return (
        <>
            <Typography variant="caption" color="primary.main" sx={{ mb: 0.5, display: 'block' }}>
                {label}
            </Typography>
            <Box sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                p: 1,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1
            }}>
                {scopes.map(s => (
                    <Chip key={s} size="small" label={s} onDelete={() => onRemove(s)} />
                ))}
                <TextField
                    size="small"
                    placeholder="Add scope… (press Enter)"
                    onKeyDown={handleKeyDown}
                    sx={{
                        minWidth: 220,
                        '& .MuiInputLabel-root': { color: 'primary.main' }
                    }}
                />
            </Box>
        </>
    )
}
