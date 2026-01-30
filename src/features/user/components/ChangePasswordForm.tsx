'use client'

import { Locale } from '@/configs/i18n'
import useChangePassword from '@features/user/hooks/useChangePassword'
import { getDictionary } from '@utils/getDictionary'
import type { Mode } from '@core/types'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import {
    Box,
    Button,
    InputAdornment,
    NoSsr,
    TextField
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller } from 'react-hook-form'

type Props = {
    locale: Locale | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    mode?: Mode
    loginname?: string
}

type PasswordFormValues = {
    oldPassword: string
    newPassword: string
    confirmPassword: string
}

const ChangePasswordForm = ({ dictionary, session, loginname = '' }: Props) => {
    const {
        control,
        handleSubmit,
        onSubmit,
        showOldPassword,
        toggleOldPassword,
        showNewPassword,
        toggleNewPassword,
        showConfirmPassword,
        toggleConfirmPassword
    } = useChangePassword({ dictionary, session, loginname })

    const PasswordField = ({
        name,
        label,
        rules,
        show,
        toggle
    }: {
        name: keyof PasswordFormValues
        label: string
        rules?: any
        show: boolean
        toggle: () => void
    }) => (
        <Controller
            name={name as any}
            control={control}
            rules={rules}
            render={({ field, fieldState: { error } }) => (
                <TextField
                    {...field}
                    label={label}
                    type={show ? "text" : "password"}
                    fullWidth
                    size="small"
                    sx={textFieldStyle}
                    error={!!error}
                    helperText={error?.message}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Box
                                        onClick={toggle}
                                        sx={{
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {show ? <VisibilityOff /> : <Visibility />}
                                    </Box>
                                </InputAdornment>
                            )
                        }
                    }}
                />
            )}
        />
    )

    return (
        <NoSsr>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <PasswordField
                    name="oldPassword"
                    label={'Current Password'}
                    rules={{
                        required: 'Current Password is required',
                        minLength: {
                            value: 6,
                            message: dictionary['auth'].passwordminlength || 'Current Password must be at least 6 characters'
                        }
                    }}
                    show={showOldPassword}
                    toggle={toggleOldPassword}
                />

                <Box height={16} />

                <PasswordField
                    name="newPassword"
                    label={dictionary['auth'].newpassword || 'New Password'}
                    rules={{
                        required: dictionary['auth'].passwordrequired || 'Password is required',
                        minLength: {
                            value: 6,
                            message: dictionary['auth'].passwordminlength || 'Password must be at least 6 characters'
                        }
                    }}
                    show={showNewPassword}
                    toggle={toggleNewPassword}
                />

                <Box height={16} />

                <PasswordField
                    name="confirmPassword"
                    label={dictionary['auth'].confirmpassword || 'Confirm Password'}
                    rules={{
                        required: dictionary['auth'].confirmpasswordrequired || 'Please confirm your password'
                    }}
                    show={showConfirmPassword}
                    toggle={toggleConfirmPassword}
                />

                <Box mt={4} display="flex" justifyContent="center">
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        sx={{
                            background:
                                'radial-gradient(300.55% 959.41% at 293.35% -237.5%, #00502F 0%, #089356 67.24%, #629F0D 98.3%)',
                            color: 'white',
                            '&:hover': { opacity: 0.5 }
                        }}
                    >
                        {dictionary['auth'].changepassword || 'Change Password'}
                    </Button>
                </Box>
            </Box>

        </NoSsr>
    )
}

const textFieldStyle = {
    '& .MuiInputBase-input': {
        color: 'primary.main'
    },
    '& .MuiInputLabel-root': {
        color: 'primary.main'
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'primary.main'
        },
        '&:hover fieldset': {
            borderColor: 'primary.dark'
        },
        '&.Mui-focused fieldset': {
            borderColor: 'primary.main'
        }
    }
}

export default ChangePasswordForm

