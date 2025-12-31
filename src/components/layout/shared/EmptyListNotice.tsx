'use client'

import { Box, Grid, Typography } from '@mui/material'
import Image from 'next/image'

interface EmptyListNoticeProps {
    message?: string
}

const EmptyListNotice = ({ message = 'No data found' }: EmptyListNoticeProps) => {
    return (
        <Grid size={12} display="flex" justifyContent="center" alignItems="center" sx={{ py: 5 }}>
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Image
                    src="/images/illustrations/empty-list.svg"
                    width={160}
                    height={160}
                    alt="Empty List"
                    style={{ marginBottom: '20px' }}
                    priority
                />
                <Typography variant="body1" color="#225087">
                    {message}
                </Typography>
            </Box>
        </Grid>
    )
}

export default EmptyListNotice
