import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import { Box, Button, Tooltip } from '@mui/material'

type FormActionsProps = {
    saving: boolean
    onReset: () => void
    onBack?: () => void
    dictCommon: Record<string, string>
}

export default function FormActions({ saving, onReset, onBack, dictCommon }: FormActionsProps) {
    return (
        <Box display="flex" gap={2} justifyContent="flex-start" sx={{ mt: 2 }}>
            <Button
                variant="outlined"
                color="secondary"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                disabled={saving}
            >
                {dictCommon.back || 'Back'}
            </Button>

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
