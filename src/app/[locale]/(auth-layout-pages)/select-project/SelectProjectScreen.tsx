'use client'

import { useEffect, useState } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import LockPersonIcon from '@mui/icons-material/LockPerson'
import LogoutIcon from '@mui/icons-material/Logout'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Image from 'next/image'
import { useRouter } from '@shared/hooks/useRouter'
import { signOut } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import { useWorkingProjectStore } from '@/@core/stores/useWorkingProjectStore'
import { menuService } from '@/shared/services/menuService'
import { stopSignalRConnection } from '@/services/signalr/connection'
import { useAppContext } from '@contexts/AppContext'
import { useWorkingProjectPicker } from '@/shared/hooks/useWorkingProjectPicker'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import SystemUnavailableState from '@/shared/components/project-context/SystemUnavailableState'
import SyncOverlay from '@/views/components/SyncOverlay'
import { getLocalizedUrl } from '@utils/i18n'
import Background from '../shared/Background'
import Footer from '../shared/Footer'

const headerText = (dictionary: any, key: string, fallback: string) => dictionary?.header?.[key] ?? fallback
const commonText = (dictionary: any, key: string, fallback: string) => dictionary?.common?.[key] ?? fallback

type Props = {
  dictionary?: any
  locale: Locale
  sessiontoken?: string
}

/**
 * Standalone, chrome-free route: no sidebar, no dashboard header, no menu — those are only
 * ever loaded once a project is selected and ProjectContext is READY (see DashboardContent).
 * This page is deliberately NOT a modal: nothing here can be dismissed with Escape or a
 * backdrop click, and even a single authorized project still requires an explicit click.
 */
const SelectProjectScreen = ({ dictionary, locale, sessiontoken }: Props) => {
  const router = useRouter()
  const picker = useWorkingProjectPicker({ dictionary, sessiontoken, language: locale })
  const { clearAppData } = useAppContext()

  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Full teardown of the current session, mirroring useLogout (the standalone /logout page's
  // logic): backend WF_BO_LOGOUT, NextAuth signOut, SignalR disconnect, ProjectContext +
  // AppContext(menu/permission) reset, app cookie clear, then redirect to the localized login.
  // Called directly here (button click) instead of navigating to /logout, since this screen has
  // no dashboard chrome/session-consuming children left to unmount first.
  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)

    try {
      // Invalidate the session on the backend BEFORE clearing the Next.js session below. The
      // real backend token never reaches the browser (see src/auth.ts) — /api/logout resolves
      // it itself, server-side, from the session cookie.
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'manual' })
      })
      await stopSignalRConnection()
      await signOut({ redirect: false })
    } catch {} finally {
      useWorkingProjectStore.getState().reset()
      menuService.clearMenuCache()
      clearAppData()

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
      }

      try {
        await fetch('/api/clear-app', { method: 'POST', credentials: 'include' })
      } catch {
        // ignore — cookie clear is best-effort, session is already invalidated above
      }

      router.replace(getLocalizedUrl('/login', locale))
    }
  }

  // Already has a valid, authorized project (e.g. returning user landed here directly, or just
  // finished picking one) — bounce straight to the dashboard. The mirror condition lives in
  // DashboardContent (redirects here when NOT ready), so the two routes can't loop each other.
  useEffect(() => {
    if (picker.status === 'READY') {
      router.replace(getLocalizedUrl('/dashboards', locale))
    }
  }, [picker.status, router, locale])

  const lightlogo = '/images/logobank/logo.svg'

  // Full-page, not inside the picker card: nothing about project selection applies while
  // WF_BO_GET_BO_CONTEXT itself is unreachable. User stays signed in; retry re-runs only that call.
  if (picker.status === 'SERVICE_UNAVAILABLE') {
    return (
      <SystemUnavailableState
        dictionary={dictionary}
        retrying={picker.retrying}
        errorReference={picker.errorReference}
        onRetry={picker.handleRetry}
      />
    )
  }

  const renderBody = () => {
    if (picker.status === 'LOADING' || picker.status === 'READY') {
      // LOADING = WF_BO_GET_BO_CONTEXT in flight; READY = project just picked, redirecting to
      // /dashboards (effect above) — both are full-screen blocking states, no chrome underneath.
      return picker.status === 'READY' ? (
        <SyncOverlay
          open
          mode="standalone"
          message={headerText(dictionary, 'working_project_redirect_title', 'Đang chuyển vào hệ thống')}
          description={headerText(dictionary, 'working_project_redirect_description', 'Vui lòng đợi trong giây lát...')}
        />
      ) : (
        <SyncOverlay
          open
          mode="standalone"
          message={headerText(dictionary, 'working_project_boot_title', 'Đang kết nối hệ thống')}
          description={headerText(dictionary, 'working_project_boot_description', 'Đang tải thông tin dự án và thiết lập phiên làm việc...')}
        />
      )
    }

    if (picker.status === 'NO_PROJECT_ACCESS') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 2, sm: 4 },
            pt: { xs: 4, sm: 6 },
            pb: { xs: 3, sm: 4 }
          }}
        >
          <LockPersonIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            {headerText(dictionary, 'working_project_unauthorized_title', 'Your account has not been granted access to any project.')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {headerText(dictionary, 'working_project_unauthorized_description', 'Please contact your administrator to request project access.')}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="outlined"
              startIcon={<SupportAgentIcon />}
              disabled={loggingOut}
              onClick={() => setContactDialogOpen(true)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {headerText(dictionary, 'working_project_contact_admin_button', 'Contact Management Board')}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              loading={loggingOut}
              disabled={loggingOut}
              onClick={handleLogout}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {loggingOut
                ? headerText(dictionary, 'working_project_logging_out', 'Signing out...')
                : headerText(dictionary, 'working_project_exit_button', 'Exit')}
            </Button>
          </Stack>
        </Box>
      )
    }

    if (picker.status === 'ERROR') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', px: { xs: 2, sm: 4 }, py: 6 }}>
          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              maxWidth: 400,
              borderRadius: 3,
              textAlign: 'center',
              px: { xs: 3, sm: 4 },
              py: { xs: 3.5, sm: 4 },
              bgcolor: 'error.lighterOpacity',
              borderColor: 'error.lightOpacity',
              boxShadow: '0 4px 16px rgba(211,47,47,0.06)'
            }}
          >
            <Stack spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'error.lightOpacity',
                  flexShrink: 0
                }}
              >
                <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {headerText(dictionary, 'working_project_load_failed', 'Unable to load project list')}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {headerText(
                  dictionary,
                  'working_project_load_failed_description',
                  'An error occurred while loading project information. Please check your connection and try again.'
                )}
              </Typography>

              {picker.errorReference && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover'
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {headerText(dictionary, 'working_project_error_reference', 'Mã tham chiếu')}: {picker.errorReference}
                  </Typography>
                </Box>
              )}

              <Button variant="contained" startIcon={<RefreshIcon />} onClick={picker.handleRetry} sx={{ mt: 1 }}>
                {headerText(dictionary, 'working_project_retry', 'Retry')}
              </Button>
            </Stack>
          </Paper>
        </Box>
      )
    }

    // REQUIRE_SELECTION
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <TextField
          fullWidth
          size="small"
          sx={{ mb: 2, flexShrink: 0 }}
          label={headerText(dictionary, 'working_project_search_label', 'Search')}
          placeholder={headerText(dictionary, 'working_project_search_placeholder', 'Search by project code or name')}
          value={picker.searchText}
          onChange={event => picker.setSearchText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') picker.handleSearchSubmit()
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => picker.handleSearchSubmit()}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />

        {picker.items.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {headerText(dictionary, 'working_project_picker_empty_title', 'No project found')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {headerText(dictionary, 'working_project_picker_empty_description', 'Try a different search keyword.')}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 360,
              maxHeight: 'calc(100vh - 390px)',
              pr: 1
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))'
                }
              }}
            >
              {picker.items.map(project => (
                <Paper
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => picker.handleSelect(project)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') picker.handleSelect(project)
                  }}
                  sx={{
                    p: 2,
                    height: { xs: 'auto', sm: 120 },
                    minHeight: 110,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: 2,
                    borderColor: 'divider',
                    outline: 'none',
                    transition: 'border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-1px)',
                      boxShadow: 3
                    },
                    '&:focus-visible': {
                      borderColor: 'primary.main',
                      outline: theme => `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  <ApartmentIcon color="action" sx={{ fontSize: 26 }} />
                  <Typography
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {formatProjectLabel(project)}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {picker.totalCount > picker.pageSize && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3, flexShrink: 0 }}>
            <Pagination
              page={picker.pageIndex + 1}
              count={Math.max(1, Math.ceil(picker.totalCount / picker.pageSize))}
              onChange={(_, page) => picker.handlePageChange(page)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Background>
      <Box className="flex w-full min-h-screen items-center justify-center" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          className="z-10 rounded-lg flex flex-col"
          sx={{
            width: {
              xs: 'calc(100% - 24px)',
              sm: 'calc(100% - 48px)',
              lg: 'calc(100% - 96px)'
            },
            maxWidth: 1400,
            minHeight: { xs: 'auto', md: 720 },
            maxHeight: 'calc(100vh - 64px)',
            mx: 'auto',
            px: { xs: 2, sm: 4, md: 5 },
            py: { xs: 3, md: 4 },
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
            border: '1px solid rgba(15, 23, 42, 0.06)'
          }}
        >
          <Box sx={{ position: 'relative', width: 152, height: 51, mx: 'auto', mb: 2, flexShrink: 0 }}>
            <Image
              src={lightlogo}
              alt="IPS Logo"
              width={152}
              height={51}
              loading="eager"
              style={{ objectFit: 'contain' }}
              className="mx-auto"
            />
          </Box>

          <Stack spacing={0.5} alignItems="center" sx={{ mb: 2.5, textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {headerText(dictionary, 'working_project_picker_title', 'Select working project')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {picker.wasProjectInvalidated
                ? headerText(dictionary, 'working_project_invalidated_description', 'Your previously selected project is no longer available to your account. Please choose another project.')
                : headerText(dictionary, 'working_project_selection_required_description', 'Choose the project you want to work on before continuing.')}
            </Typography>
          </Stack>

          {renderBody()}
        </Box>
      </Box>

      <Footer dictionary={dictionary} />

      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {headerText(dictionary, 'working_project_contact_dialog_title', 'Management Board Contact')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {headerText(
              dictionary,
              'working_project_contact_dialog_fallback',
              'Please contact your system administrator to request project access.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>{commonText(dictionary, 'close', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </Background>
  )
}

export default SelectProjectScreen
