'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Button, IconButton, Tooltip } from '@mui/material'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { getLocalizedUrl } from '@utils/i18n'
import type { Locale } from '@configs/i18n'

type Props = {
    label?: string
    showLabel?: boolean
    fullWidth?: boolean
    /** 'warning' renders the icon/label in the theme's warning color to stand out from other actions. */
    colorVariant?: 'inherit' | 'warning'
}

const Logout = ({ label = 'Đăng xuất', showLabel = false, fullWidth = false, colorVariant = 'inherit' }: Props) => {
    const isWarning = colorVariant === 'warning'
    const router = useRouter()
    const { locale } = useParams()
    const [isNavigating, setIsNavigating] = useState(false)

    // Actual backend logout (WF_BO_LOGOUT) + NextAuth signOut + session/local-storage cleanup
    // are all performed on the /logout page itself — see RedirectToLogout/useLogout — which then
    // redirects to /${locale}/login once done. This button only navigates there; it must not call
    // signOut() directly, and must not touch any other component's state (sidebar collapse, the
    // "Cài đặt" radial menu, active menu item, etc).
    const handleUserLogout = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()

        if (isNavigating) return
        setIsNavigating(true)

        router.push(getLocalizedUrl('/logout', locale as Locale))
    }

    const logoutIcon = <i className='ri-logout-box-r-line' />

    return (
        <div className='flex items-center gap-4 w-full'>
            <div className='flex items-center gap-2 w-full'>
                {showLabel ? (
                    <Button
                        fullWidth={fullWidth}
                        startIcon={logoutIcon}
                        onClick={handleUserLogout}
                        sx={{
                            justifyContent: 'flex-start',
                            minHeight: 38,
                            px: 1.5,
                            borderRadius: 2,
                            color: isWarning ? 'warning.main' : 'common.white',
                            textTransform: 'none',
                            fontWeight: 500,
                            '& .MuiButton-startIcon': { fontSize: 22, minWidth: 24 },
                            '&:hover': {
                                backgroundColor: isWarning ? 'var(--mui-palette-warning-lightOpacity)' : 'rgba(255, 255, 255, 0.12)'
                            }
                        }}
                    >
                        {label}
                    </Button>
                ) : (
                <Tooltip title={label} placement='right'>
                    <span className='inline-flex'>
                        <IconButton
                            className={`flex gap-1 p-2 rounded-full cursor-pointer flag text-[22px] ${isWarning ? '' : 'text-white'}`}
                            onClick={handleUserLogout}
                            sx={isWarning ? { color: 'warning.main' } : undefined}
                        >
                            {logoutIcon}
                        </IconButton>
                    </span>
                </Tooltip>
                )}
            </div>
        </div>
    )
}

export default Logout
