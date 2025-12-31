'use client'

import LanguageDropdown from '@/@core/components/layouts/shared/LanguageDropdown'
import { createLoginSchema } from '@/@core/schemas/auth'
import LoginLoading from '@/components/LoginLoading'
import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { useLoginHandler } from '@/services/useLoginHandler'
import { getDictionary } from '@/utils/getDictionary'
import type { FormData } from '@core/types'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Box, Button, TextField, Typography, useTheme } from '@mui/material'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import LoginField from './login-field'

const LoginForm = ({ locale, dictionary }: {
    locale: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const theme = useTheme()

    const {
        onSubmit,
        loading,
        errorState,
        setErrorState,
    } = useLoginHandler({ locale, dictionary })

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<FormData>({
        resolver: valibotResolver(createLoginSchema(dictionary)),
        defaultValues: {
            username: '',
            password: ''
        }
    })

    const [isPasswordShown, setIsPasswordShown] = useState<boolean>(false)
    const handleClickShowPassword = () => setIsPasswordShown(prev => !prev)

    return (
        <>
            <Box className="relative">
                {loading && <LoginLoading loadingtext={dictionary['common'].loading} />}

                <Box className="space-y-12 text-center text-white body font-sans">
                    <Box className="space-y-1 body-header ng-star-inserted">
                        <Typography
                            variant='h2'
                            className='font-sans text-primary'
                            sx={{ fontFamily: 'Quicksand' }}
                        >
                            {env.NEXT_PUBLIC_APPLICATION_TITLE}
                        </Typography>
                        <Box className="text-16-medium text-primary" sx={{ fontFamily: 'Quicksand' }}>
                            {dictionary['auth'].welcome}
                        </Box>
                    </Box>

                    <Box className="body-content body-content-width-small">
                        <form
                            noValidate
                            onSubmit={handleSubmit(onSubmit)}
                            autoComplete='off'
                            className='flex flex-col gap-5'
                        >
                            {errorState &&
                                <Box className="bg-white px-4 py-3 rounded-xl status-error wrapper">
                                    <Box className="flex items-start gap-2">
                                        <i className='ri-close-circle-line w-6 h-6 text-red-600'></i>
                                        <span className='text-gray-700 text-[13px] text-left title'>
                                            {errorState.message}
                                        </span>
                                    </Box>
                                </Box>
                            }

                            <LoginField
                                name="username"
                                control={control}
                                label={dictionary['auth'].username}
                                error={errors.username}
                                autoFocus
                                tooltipContent={
                                    <>
                                        <Typography variant="inherit" sx={{ fontSize: '12px' }}>
                                            {dictionary['auth'].tooltip_username_p}
                                            <Typography component="span" className="text-primary" sx={{ fontSize: '12px' }}>
                                                {dictionary['auth'].tooltip_username_span}
                                            </Typography>
                                        </Typography>
                                        <Typography variant="inherit" sx={{ fontSize: '12px' }}>
                                            {dictionary['auth'].tooltip_without_username_p}
                                            <Typography component="span" className="text-primary" sx={{ fontSize: '12px' }}>
                                                {dictionary['auth'].tooltip_without_username_span}{' '}
                                                {dictionary['auth'].tooltip_without_username_span_2}
                                            </Typography>
                                        </Typography>
                                    </>
                                }
                            />

                            <LoginField
                                name="password"
                                control={control}
                                label={dictionary['auth'].password}
                                error={errors.password}
                                isPassword
                                isPasswordShown={isPasswordShown}
                                onTogglePassword={handleClickShowPassword}
                                onClearError={() => setErrorState(null)}
                            />

                            <TextField
                                type="text"
                                name="honeypot"
                                style={{ display: 'none' }}
                                autoComplete="off"
                            />

                            <Box className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1 z-10'>
                                <LanguageDropdown lang={locale as Locale} />
                                <Typography
                                    className='text-end'
                                    color='primary'
                                    component={Link}
                                    href={`/` + locale + '/forgot-password'}
                                    sx={{ fontFamily: 'Quicksand, sans-serif' }}
                                >
                                    {`${dictionary['auth'].forgotpassword}?`}
                                </Typography>
                            </Box>


                            <Button
                                fullWidth
                                variant='contained'
                                className='mt-5 p-3'
                                type='submit'
                                sx={{
                                    background:
                                        'radial-gradient(300.55% 959.41% at 293.35% -237.5%, #6EC2F7 0%, #2531F5 67.24%,  #04E7B2 98.3%)',
                                    color: 'white',
                                    '&:hover': { opacity: 0.5 }
                                }}
                            >
                                {dictionary['auth'].login}
                            </Button>
                        </form>
                    </Box>
                </Box>
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    bottom: { xs: 'auto', sm: 8 },
                    top: { xs: 8, sm: 'auto' },
                    right: { xs: 8, sm: 16 },
                    fontSize: { xs: '14px', sm: '16px' },
                    color: theme.palette.primary.main,
                    opacity: 0.7,
                    fontFamily: 'Quicksand, sans-serif',
                    zIndex: 1000
                }}
            >
                v{env.NEXT_PUBLIC_VERSION} - {env.NEXT_PUBLIC_ENVIRONMENT}
            </Box>
        </>
    )
}

export default LoginForm
