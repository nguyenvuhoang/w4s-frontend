'use client'

import { useImageVariant } from '@/@core/hooks/useImageVariant'
import type { Locale } from '@/configs/i18n'
import type { Mode } from '@core/types'
import { Box, NoSsr } from '@mui/material'
import Image from 'next/image'
import { getDictionary } from '@/utils/getDictionary'
import LoginForm from '@/views/forms/auth/login-form'

const Login = ({ mode, dictionary, locale }: {
    mode: Mode,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale
}) => {
    const darkImg = '/images/pages/login-night.jpg'
    const lightImg = '/images/pages/login-day.jpg'
    const authBackground = useImageVariant(mode, lightImg, darkImg)

    const darklogo = '/images/logobank/emi.svg'
    const lightlogo = '/images/logobank/emi.svg'
    const logo = useImageVariant(mode, lightlogo, darklogo)

    return (
        <NoSsr>
            <Box className="flex w-full h-screen">
                {/* Left Side - Background Image */}
                <Box
                    className="hidden md:block w-[70%] h-full"
                    sx={{
                        position: 'relative',
                        backgroundImage: `url(${authBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            boxShadow: 'inset 0 0 120px 80px rgba(255, 255, 255, 1)',
                            pointerEvents: 'none',
                        }
                    }}
                />

                {/* Right Side - Login Form */}
                <Box className="w-full md:w-[30%] h-full bg-white flex flex-col justify-center px-6 sm:px-10 py-10">
                    <Box
                        sx={{
                            position: 'relative',
                            width: 200,
                            height: 67,
                            mx: 'auto', // center horizontally
                            mb: 8
                        }}
                    >
                        <Image
                            src={logo}
                            alt="EMI Logo"
                            width={200}
                            height={67}
                            style={{ objectFit: 'contain' }}
                            className="mx-auto"
                        />
                    </Box>



                    <LoginForm
                        locale={locale as Locale}
                        dictionary={dictionary}
                    />
                </Box>
            </Box>
        </NoSsr>
    )
}

export default Login
