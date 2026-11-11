import { useState } from 'react'
import { useForm } from 'react-hook-form'
import SwalAlert from '@utils/SwalAlert'
import { changePassword } from '@features/user/services/changePassword'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'

type PasswordFormValues = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

type UseChangePasswordParams = {
  dictionary: any
  session: Session | null
  loginname?: string
}

export function useChangePassword({ dictionary, session, loginname = '' }: UseChangePasswordParams) {
  const { control, handleSubmit, reset } = useForm<PasswordFormValues>({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleUserLogout = async () => {
    try {
      // Invalidate the session on the backend BEFORE clearing the Next.js session below. The
      // real backend token never reaches the browser (see src/auth.ts) — /api/logout resolves
      // it itself, server-side, from the session cookie.
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'manual' })
      })
    } catch {} finally {
      await signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL })
    }
  }

  const onSubmit = async (data: PasswordFormValues) => {
    if (data.newPassword !== data.confirmPassword) {
      SwalAlert('warning', dictionary['auth'].passwordnotmatch || 'Passwords do not match', 'center')
      return
    }
    if (data.oldPassword === data.newPassword) {
      SwalAlert('warning', dictionary['auth'].passwordsameasold || 'New password must be different from the old password', 'center')
      return
    }

    try {
      const userName = loginname || ''
      const apiChangePassword = await changePassword(
        '',
        userName,
        data.oldPassword,
        data.newPassword
      )

      if (apiChangePassword.status === 200) {
        const hasError = apiChangePassword.payload.dataresponse.errors.length > 0
        if (hasError) {
          SwalAlert('error', apiChangePassword.payload.dataresponse.errors?.[0]?.info || dictionary['common'].updateerror, 'center')
        } else {
          SwalAlert('success', dictionary['auth'].passwordchanged || 'Password changed successfully', 'center', false, false, true, () => {
            handleUserLogout()
          })
        }

      } else {
      }

    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'Error changing password'
      SwalAlert('error', errorMessage, 'center')
    }

    reset()
  }

  return {
    control,
    handleSubmit,
    onSubmit,
    reset,
    showOldPassword,
    toggleOldPassword: () => setShowOldPassword(v => !v),
    showNewPassword,
    toggleNewPassword: () => setShowNewPassword(v => !v),
    showConfirmPassword,
    toggleConfirmPassword: () => setShowConfirmPassword(v => !v)
  }
}

export default useChangePassword

