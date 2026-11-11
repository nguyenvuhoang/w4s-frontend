'use client'

import { useTransition } from 'react'

import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
// Stock next/navigation router on purpose (same reason as views/Error.tsx): this state can render
// from a Server Component error branch, where the app's progress-bar-driven useRouter isn't
// guaranteed to have its provider.
import { useRouter } from 'next/navigation'

const text = (dictionary: any, key: string, fallback: string) => dictionary?.systemUnavailable?.[key] ?? fallback

type Props = {
  dictionary?: any
  /**
   * Retries exactly the failed bootstrap (WF_BO_GET_BO_CONTEXT via useWorkingProjectStore).
   * Omitted when rendered from a Server Component (AuthorizedLayout) — then the retry is a
   * router.refresh(), which re-runs that server render (and its BO context call) without a
   * browser reload.
   */
  onRetry?: () => void
  /** Request in flight — keeps the button disabled so retries can't be double-submitted. */
  retrying?: boolean
  /** WF_BO_GET_BO_CONTEXT execution_id, shown as an error reference when available. */
  errorReference?: string | null
  /** 'page' = full viewport (no dashboard chrome yet); 'content' = inside the dashboard content area. */
  variant?: 'page' | 'content'
}

/**
 * Full-page "system temporarily unavailable" state for a WF_BO_GET_BO_CONTEXT timeout / 502 /
 * 503 / 504. Deliberately not a popup, and never logs the user out: the session is still valid,
 * only the backend is unreachable. Wording avoids claiming maintenance for certain, since a
 * timeout can just as well be an upstream/network problem.
 */
const SystemUnavailableState = ({ dictionary, onRetry, retrying = false, errorReference, variant = 'page' }: Props) => {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  const busy = retrying || isRefreshing

  const handleRetry = () => {
    if (busy) return

    if (onRetry) {
      onRetry()

      return
    }

    startRefresh(() => router.refresh())
  }

  return (
    <Box
      sx={{
        minHeight: variant === 'page' ? '100vh' : 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 4, sm: 6 },
        bgcolor: variant === 'page' ? 'background.default' : 'transparent'
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 3,
          textAlign: 'center',
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 5 }
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'warning.lighterOpacity',
              flexShrink: 0
            }}
          >
            <CloudOffOutlinedIcon color="warning" sx={{ fontSize: 36 }} />
          </Box>

          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            {text(dictionary, 'title', 'Hệ thống đang tạm thời gián đoạn')}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {text(
              dictionary,
              'description',
              'Hệ thống hiện đang trong quá trình bảo trì hoặc tạm thời không thể kết nối đến dịch vụ.'
            )}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {text(dictionary, 'hint', 'Vui lòng thử lại sau ít phút.')}
          </Typography>

          {errorReference && (
            <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: 'action.hover' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
              >
                {text(dictionary, 'errorReference', 'Mã tra cứu lỗi')}: {errorReference}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            loading={busy}
            loadingPosition="start"
            disabled={busy}
            onClick={handleRetry}
            sx={{ mt: 1, width: { xs: '100%', sm: 'auto' }, px: 4 }}
          >
            {busy ? text(dictionary, 'retrying', 'Đang thử lại...') : text(dictionary, 'retry', 'Thử lại')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}

export default SystemUnavailableState
