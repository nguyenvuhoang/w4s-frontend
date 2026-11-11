'use client'

import { Alert } from '@mui/material'
import toast from 'react-hot-toast'

export const SERVICE_SETTINGS_SUCCESS_TOAST_ID = 'service-settings-update-success'
export const SERVICE_SETTINGS_SUCCESS_TOAST_DURATION = 3000

/**
 * Small non-blocking success toast (top-right, no backdrop, auto-closes) for inline updates.
 * Reuses the app-wide react-hot-toast <Toaster>; position/duration are overridden only for this
 * toast so the global toast configuration and SweetAlert usage stay unchanged.
 */
export const showServiceSettingsSuccessToast = (message: string, closeLabel: string) =>
  toast.custom(
    t => (
      <Alert
        severity='success'
        variant='filled'
        role='status'
        onClose={() => toast.dismiss(t.id)}
        slotProps={{ closeButton: { 'aria-label': closeLabel, title: closeLabel } }}
        sx={{
          minWidth: 280,
          maxWidth: 420,
          boxShadow: 6,
          alignItems: 'center',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 150ms ease, transform 150ms ease'
        }}
      >
        {message}
      </Alert>
    ),
    {
      id: SERVICE_SETTINGS_SUCCESS_TOAST_ID,
      position: 'top-right',
      duration: SERVICE_SETTINGS_SUCCESS_TOAST_DURATION
    }
  )
