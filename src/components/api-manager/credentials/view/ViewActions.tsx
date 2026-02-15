'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Button, Box } from '@mui/material'
import { useRouter } from 'next/navigation'
import { getLocalizedUrl } from '@/shared/utils/i18n'
import { Locale } from '@/configs/i18n'

type ViewActionsProps = {
    locale: Locale
    backLabel: string
}

export default function ViewActions({ locale, backLabel }: ViewActionsProps) {
    const router = useRouter()

    const handleBack = () => {
        router.push(getLocalizedUrl('/api-manager/credentials/', locale))
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Button
                variant="outlined"
                color="secondary"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
            >
                {backLabel}
            </Button>
        </Box>
    )
}
