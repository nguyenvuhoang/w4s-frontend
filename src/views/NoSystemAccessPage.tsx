'use client'

// Deliberately next/navigation's stock useRouter, not the app's custom progress-bar-driven one —
// same reasoning as src/views/Error.tsx: this screen is rendered from (dashboard)/layout.tsx's
// handleApiError branch, which runs BEFORE <Providers> (and therefore ProgressProvider) ever
// mounts. Depending on the custom hook here would throw "useProgress must be used within a
// ProgressProvider" and crash the very screen meant to explain the error.
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import { getLocalizedUrl } from '@/shared/utils/i18n'

type NoSystemAccessPageProps = {
    locale: Locale
    dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

/**
 * Dedicated state for "session is valid, but the user has no role/channel assignment into the BO
 * admin system at all" (backend: "...does not have the required role for channel [BO]") — see
 * isNoSystemAccessError. Deliberately a different screen/copy from SelectProjectScreen's
 * NO_PROJECT_ACCESS ("chưa được phân công dự án"): that case means the user IS a valid BO user
 * with no project assigned yet; this one means they never got into BO in the first place. Mixing
 * the two copy would tell an admin-less user to go pick a project, which doesn't apply to them.
 */
const NoSystemAccessPage = ({ locale, dictionary }: NoSystemAccessPageProps) => {
    const router = useRouter()
    const [isRetrying, startRetry] = useTransition()

    const text = dictionary?.common?.noSystemAccess

    const handleRetry = () => {
        if (isRetrying) return

        // The failure this screen reacts to comes from a Server Component (WF_BO_APP_INFO inside
        // (dashboard)/layout.tsx's PortalLayoutContent) — router.refresh() re-runs that boot check
        // server-side without a full page reload, so an admin granting access mid-session is
        // picked up on the next click instead of requiring a manual browser reload.
        startRetry(() => {
            router.refresh()
        })
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
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
                    borderRadius: 4
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
                                bgcolor: 'warning.lighter',
                                color: 'warning.main'
                            }}
                        >
                            <ShieldOutlined sx={{ fontSize: 44 }} />
                        </Box>

                        <Box>
                            <Typography variant='h5' fontWeight={700}>
                                {text?.title ?? 'Bạn chưa có quyền truy cập hệ thống'}
                            </Typography>

                            <Typography variant='body1' color='text.secondary' sx={{ mt: 1.5 }}>
                                {text?.description ?? 'Tài khoản của bạn hiện chưa được cấp quyền truy cập hệ thống quản trị.'}
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
                            <Stack direction='row' spacing={1.5} alignItems='center' justifyContent='center'>
                                <SupportAgentOutlined color='disabled' />
                                <Typography variant='body2' color='text.secondary'>
                                    {text?.contactAdministrator ?? 'Vui lòng liên hệ quản lý hoặc quản trị viên để được cấp quyền truy cập.'}
                                </Typography>
                            </Stack>
                        </Box>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            justifyContent='center'
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                            <Button
                                variant='outlined'
                                disabled={isRetrying}
                                startIcon={isRetrying ? <CircularProgress size={16} /> : undefined}
                                onClick={handleRetry}
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                {isRetrying ? (text?.retrying ?? 'Đang kiểm tra...') : (text?.retry ?? 'Thử lại')}
                            </Button>

                            {/* Plain href, not a client router push: reuses the app's one existing
                            logout flow (useLogout, mounted at /logout) as-is instead of
                            reimplementing session/store/cache clearing here. */}
                            <Button
                                variant='contained'
                                color='error'
                                href={getLocalizedUrl('/logout', locale)}
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                {text?.backToLogin ?? 'Quay lại đăng nhập'}
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    )
}

export default NoSystemAccessPage
