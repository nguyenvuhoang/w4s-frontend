'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Image from 'next/image'

type MaintenanceDictionary = {
    title?: string
    message?: string
    retryButton?: string
    backToHome?: string
}

type Props = {
    dictionary?: MaintenanceDictionary
    locale?: string
}

const Maintenance = ({ dictionary, locale = 'vi' }: Props) => {
    const title = dictionary?.title ?? 'Hệ thống đang trong quá trình bảo trì'
    const message = dictionary?.message ?? 'Dịch vụ hiện tạm thời không khả dụng.\nVui lòng quay lại sau.'
    const retryButton = dictionary?.retryButton ?? 'Thử lại'

    const handleRetry = () => {
        if (typeof window !== 'undefined') {
            window.location.href = `/${locale}`
        }
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: 4
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    maxWidth: 520
                }}
            >
                <Image src="/images/icon/warning.svg" width={72} height={72} alt="maintenance" priority />

                <Typography variant="h5" sx={{ fontWeight: 700, mt: 4 }}>
                    {title}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
                    {message}
                </Typography>

                <Button variant="contained" sx={{ mt: 4, borderRadius: 2, paddingX: 4 }} onClick={handleRetry}>
                    {retryButton}
                </Button>
            </Paper>
        </Box>
    )
}

export default Maintenance
