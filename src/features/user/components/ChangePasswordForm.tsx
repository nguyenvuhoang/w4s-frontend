'use client'

import { Locale } from '@/configs/i18n'
import useChangePassword from '@features/user/hooks/useChangePassword'
import { getDictionary } from '@utils/getDictionary'
import type { Mode } from '@core/types'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import {
    Box,
    Button,
    CircularProgress,
    InputAdornment,
    NoSsr,
    TextField
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useFormState } from 'react-hook-form'

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

    const { isSubmitting } = useFormState({ control })

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
                    label={dictionary['auth'].currentpassword || 'Current Password'}
                    rules={{
                        required: dictionary['auth'].currentpasswordrequired || 'Current Password is required',
                        minLength: {
                            value: 6,
                            message: dictionary['auth'].passwordminlength || 'Current Password must be at least 6 characters'
                        }
                    }}
                    show={showOldPassword}
                    toggle={toggleOldPassword}
                />

                <Box height={20} />

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

                <Box height={20} />

                <PasswordField
                    name="confirmPassword"
                    label={dictionary['auth'].confirmpassword || 'Confirm Password'}
                    rules={{
                        required: dictionary['auth'].confirmpasswordrequired || 'Please confirm your password'
                    }}
                    show={showConfirmPassword}
                    toggle={toggleConfirmPassword}
                />

                <Box mt={5}>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        className="p-3"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                        sx={{
                            background:
                                'radial-gradient(300.55% 959.41% at 293.35% -237.5%, #6EC2F7 0%, #2531F5 67.24%, #04E7B2 98.3%)',
                            color: 'white',
                            '&:hover': { opacity: 0.5 },
                            '&.Mui-disabled': {
                                color: 'white',
                                opacity: 0.5
                            }
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
    '& label.Mui-focused': {
        color: 'primary.main'
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'primary.main'
        },
        '&:hover fieldset': {
            borderColor: 'primary.main'
        },
        '&.Mui-focused fieldset': {
            borderColor: 'primary.main'
        }
    }
}

export default ChangePasswordForm

