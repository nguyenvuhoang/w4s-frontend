'use client'

import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { getDictionary } from '@utils/getDictionary'
import LoginForm from '@features/auth/components/login-form'
import { useSettings } from '@core/hooks/useSettings'
import { Box } from '@mui/material'
import Background from '../../shared/Background'
import Footer from '../../shared/Footer'
import LoginHeader from './LoginHeader'

const Login = ({ dictionary, locale }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale
}) => {
    const { settings } = useSettings()
    const lightlogo = settings.logos?.login_title || '/images/logobank/logo.svg'
    const appTitle = settings.brandingName || env.NEXT_PUBLIC_APPLICATION_TITLE as string

    return (
        <Background>
            <Box className="flex w-full min-h-screen items-center justify-center">
                {/* Centered Login Form Overlay */}
                <Box className="z-10 w-full max-w-xl rounded-lg flex flex-col justify-center px-6 sm:px-10 py-10 mx-4"
                    sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
                        border: '1px solid rgba(15, 23, 42, 0.06)'
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            width: 200,
                            height: 67,
                            mx: 'auto', // center horizontally
                            mb: 8
                        }}
                    >
                        {/* Plain <img>, not next/image: a custom branding logo can come from any
                        MinIO/external host, which next/image would reject unless whitelisted in
                        next.config.mjs's images.remotePatterns. */}
                        <img
                            src={lightlogo}
                            alt={appTitle}
                            width={200}
                            height={67}
                            loading="eager"
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            className="mx-auto"
                        />
                    </Box>
                    <Box className="space-y-12 text-center text-gray-800">
                        <LoginHeader
                            appTitle={appTitle}
                            welcomeText={dictionary['auth'].welcome}
                        />
                        <LoginForm
                            locale={locale as Locale}
                            dictionary={dictionary}
                        />
                        <Footer dictionary={dictionary} />
                    </Box>
                </Box>
            </Box>
        </Background>
    )
}

export default Login
