'use client'

import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { keyframes } from '@mui/system'

import BrandLoadingLogo from '@components/BrandLoadingLogo'

const syncMove = keyframes`
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
`

const softGlow = keyframes`
  0%, 100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.06);
  }
`

export type SyncOverlayMode = 'content' | 'standalone'

type SyncOverlayProps = {
  open: boolean
  message?: string
  description?: string
  /**
   * 'content' (default) — scoped to the nearest positioned ancestor (`position: relative` content
   * wrapper). Used for in-page loading inside the Dashboard: tables, forms, detail screens, tabs,
   * filters, refresh — Header/Sidebar/breadcrumbs/project selector stay fully visible because the
   * overlay never leaves its own content wrapper. This is the default specifically so an existing
   * management screen can never accidentally blank out the whole app by omitting a prop.
   *
   * 'standalone' — full-viewport branded boot screen (`position: fixed`, gradient background,
   * brand logo). Reserved for screens with no Dashboard chrome to protect: login/register/reset-password/
   * forgot-password, ProjectContext bootstrap, and the first-time /select-project screen. Never use
   * this inside a Dashboard-rendered page — it visually covers Header/Sidebar even though they're
   * still mounted underneath.
   */
  mode?: SyncOverlayMode
}

const DEFAULT_MESSAGE = 'Đang kết nối hệ thống'
const DEFAULT_DESCRIPTION = 'Đang tải thông tin dự án và thiết lập phiên làm việc...'
const DEFAULT_CONTENT_MESSAGE = 'Đang tải dữ liệu...'

// Thin indeterminate bar under the brand logo — the previous computer<->bank motif was IPS
// (banking) branding; W4S shows its own logo instead (see BrandLoadingLogo).
const SyncIndicator = ({ tone }: { tone: 'onGradient' | 'onSurface' }) => {
  const onGradient = tone === 'onGradient'

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: 120, sm: 180 },
        height: 4,
        backgroundColor: onGradient ? theme => alpha(theme.palette.common.white, 0.25) : 'action.hover',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '-30%',
          width: '30%',
          height: '100%',
          borderRadius: 2,
          backgroundColor: onGradient ? 'common.white' : 'primary.main',
          animation: `${syncMove} 1.2s linear infinite`
        }}
      />
    </Box>
  )
}

const ContentOverlay = ({ message, description }: { message?: string; description?: string }) => (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      zIndex: theme => theme.zIndex.modal - 1,
      borderRadius: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      textAlign: 'center',
      px: 2,
      bgcolor: theme => alpha(theme.palette.background.paper, 0.82),
      backdropFilter: 'blur(2px)'
    }}
  >
    <BrandLoadingLogo width={88} />
    <SyncIndicator tone="onSurface" />

    <Box>
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, fontFamily: "Quicksand" }}>
        {message ?? DEFAULT_CONTENT_MESSAGE}
      </Typography>
      {description ? (
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  </Box>
)

const StandaloneOverlay = ({ message, description }: { message?: string; description?: string }) => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: theme => theme.zIndex.modal + 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      px: 2,
      overflow: 'hidden',
      background: theme =>
        `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 55%, ${alpha(theme.palette.secondary.main, 0.82)} 100%)`
    }}
  >
    {/* soft glow blobs so the background isn't a flat gradient */}
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: '-12%',
        left: '-10%',
        width: 360,
        height: 360,
        borderRadius: '50%',
        filter: 'blur(90px)',
        backgroundColor: theme => alpha(theme.palette.common.white, 0.14),
        animation: `${softGlow} 6s ease-in-out infinite`
      }}
    />
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        bottom: '-16%',
        right: '-10%',
        width: 420,
        height: 420,
        borderRadius: '50%',
        filter: 'blur(110px)',
        backgroundColor: theme => alpha(theme.palette.secondary.light || theme.palette.secondary.main, 0.18),
        animation: `${softGlow} 7s ease-in-out infinite 1.5s`
      }}
    />

    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <BrandLoadingLogo tone="dark" width={104} />
    </Box>

    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        px: 5,
        py: 4,
        borderRadius: 4,
        bgcolor: theme => alpha(theme.palette.background.paper, 0.12),
        border: theme => `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
        backdropFilter: 'blur(10px)',
        boxShadow: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        maxWidth: 420,
        textAlign: 'center'
      }}
    >
      <SyncIndicator tone="onGradient" />

      <Box>
        <Typography variant="subtitle1" sx={{ color: 'common.white', fontWeight: 700 }}>
          {message ?? DEFAULT_MESSAGE}
        </Typography>
        <Typography variant="body2" sx={{ color: theme => alpha(theme.palette.common.white, 0.75), mt: 0.5 }}>
          {description ?? DEFAULT_DESCRIPTION}
        </Typography>
      </Box>
    </Box>
  </Box>
)

/**
 * Defaults to `mode="content"` on purpose: every existing/new caller inside a management screen
 * that forgets to pass `mode` gets the scoped, non-destructive overlay instead of accidentally
 * blanking out the whole app. Only ProjectContext bootstrap / auth-layout-pages screens should
 * ever pass `mode="standalone"` explicitly.
 */
const SyncOverlay = ({ open, message, description, mode = 'content' }: SyncOverlayProps) => {
  if (!open) return null // Không hiển thị nếu không bật

  return mode === 'standalone' ? (
    <StandaloneOverlay message={message} description={description} />
  ) : (
    <ContentOverlay message={message} description={description} />
  )
}

export default SyncOverlay
