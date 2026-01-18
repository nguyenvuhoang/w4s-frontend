import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import LoginForm from '@features/auth/components/login-form'
import { getDictionary } from '@/utils/getDictionary'
import { Box, NoSsr } from '@mui/material'
import Image from 'next/image'
import Footer from '../../shared/Footer'
import LeftSide from '../../shared/LeftSide'
import LoginHeader from './LoginHeader'

const Login = ({ dictionary, locale }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale
}) => {
    const lightlogo = '/images/logobank/emi.svg'

    return (
        <NoSsr>
            <Box className="flex w-full h-screen">
                <LeftSide />
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
                            src={lightlogo}
                            alt="EMI Logo"
                            width={200}
                            height={67}
                            style={{ objectFit: 'contain' }}
                            className="mx-auto"
                        />
                    </Box>
                    <Box className="space-y-12 text-center text-white body font-sans">
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
        </NoSsr>
    )
}

export default Login
