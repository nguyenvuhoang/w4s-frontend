import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { getDictionary } from '@/utils/getDictionary'
import LoginForm from '@features/auth/components/login-form'
import { Box, NoSsr } from '@mui/material'
import Image from 'next/image'
import Background from '../../shared/Background'
import Footer from '../../shared/Footer'
import LoginHeader from './LoginHeader'

const Login = ({ dictionary, locale }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale
}) => {
    const lightlogo = '/images/logobank/emi.svg'

    return (
        <NoSsr>
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
                        <Image
                            src={lightlogo}
                            alt="EMI Logo"
                            width={200}
                            height={67}
                            style={{ objectFit: 'contain' }}
                            className="mx-auto"
                        />
                    </Box>
                    <Box className="space-y-12 text-center text-gray-800 body font-sans">
                        <LoginHeader
                            appTitle={env.NEXT_PUBLIC_APPLICATION_TITLE as string}
                            welcomeText={dictionary['auth'].welcome}
                        />
                        <LoginForm
                            locale={locale as Locale}
                            dictionary={dictionary}
                        />
                        <Footer />
                    </Box>
                    </Box>
                </Box>
            </Background>
        </NoSsr>
    )
}

export default Login
