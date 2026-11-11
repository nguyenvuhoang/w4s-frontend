// src/views/Forbidden.tsx

import BlockRounded from '@mui/icons-material/BlockRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import { getLocalizedUrl } from '@/shared/utils/i18n'

type ForbiddenPageProps = {
    locale: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    message?: string
}

const ForbiddenPage = ({
    locale,
    dictionary,
    message
}: ForbiddenPageProps) => {
    const forbiddenText = dictionary.common?.forbidden
    const displayMessage = message ?? forbiddenText?.defaultMessage ?? 'Access denied.'
    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 160px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3
            }}
        >
            <Card
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 560,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 4,
                    overflow: 'visible'
                }}
            >
                <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                    <Stack spacing={3} alignItems='center' textAlign='center'>
                        <Box
                            sx={{
                                width: 88,
                                height: 88,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'error.lighter',
                                color: 'error.main'
                            }}
                        >
                            <LockOutlined sx={{ fontSize: 44 }} />
                        </Box>

                        <Box>
                            <Typography
                                variant='h2'
                                fontWeight={800}
                                color='error.main'
                                lineHeight={1}
                            >
                                403
                            </Typography>

                            <Typography variant='h5' fontWeight={700} sx={{ mt: 2 }}>
                                {forbiddenText?.title ?? 'Access denied'}
                            </Typography>

                            <Typography
                                variant='body1'
                                color='text.secondary'
                                sx={{ mt: 1.5 }}
                            >
                                {displayMessage}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                width: '100%',
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'action.hover'
                            }}
                        >
                            <Stack
                                direction='row'
                                spacing={1.5}
                                alignItems='center'
                                justifyContent='center'
                            >
                                <BlockRounded color='disabled' />
                                <Typography variant='body2' color='text.secondary'>
                                    {forbiddenText?.contactAdministrator ?? 'Please contact the administrator to request access.'}
                                </Typography>
                            </Stack>
                        </Box>

                        <Button
                            href={getLocalizedUrl('/', locale)}
                            variant='contained'
                            startIcon={<HomeRounded />}
                            size='large'
                        >
                            {forbiddenText?.backHome ?? 'Back to home'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    )
}

export default ForbiddenPage
