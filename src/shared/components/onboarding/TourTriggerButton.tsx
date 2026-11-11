'use client'

import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Button } from '@mui/material'

type Props = {
    label: string
    onClick: () => void
    disabled?: boolean
}

/** Generic "replay this screen's tour" button, meant to be passed as the FeatureTour render-prop child. */
const TourTriggerButton = ({ label, onClick, disabled = false }: Props) => (
    <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<HelpOutlineIcon />}
        onClick={onClick}
        disabled={disabled}
    >
        {label}
    </Button>
)

export default TourTriggerButton
