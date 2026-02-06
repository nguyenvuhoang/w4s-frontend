import { Box, Button, Tooltip } from '@mui/material'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'

type FormActionsProps = {
    saving: boolean
    onReset: () => void
    dictCommon: Record<string, string>
}

export default function FormActions({ saving, onReset, dictCommon }: FormActionsProps) {
    return (
        <Box display="flex" gap={2} justifyContent="flex-start" sx={{ mt: 2 }}>
            <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
            >
                {dictCommon.save || 'Save'}
            </Button>

            <Tooltip title="Reset form">
                <span>
                    <Button
                        type="button"
                        variant="outlined"
                        color="inherit"
                        startIcon={<RestartAltIcon />}
                        onClick={onReset}
                        disabled={saving}
                    >
                        {dictCommon.reset || 'Reset'}
                    </Button>
                </span>
            </Tooltip>
        </Box>
    )
}
