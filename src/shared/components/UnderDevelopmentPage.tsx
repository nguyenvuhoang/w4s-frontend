'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CodeIcon from '@mui/icons-material/Code'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import TerminalIcon from '@mui/icons-material/Terminal'
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import { useRouter } from '@shared/hooks/useRouter'

type UnderDevelopmentPageProps = {
  title: string
  description: string
  backLabel: string
  homeLabel: string
  homeHref?: string
  badgeLabel?: string
  progressLabel?: string
  terminalLines?: string[]
}

const cursorBlink = keyframes`
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
`

const progressPulse = keyframes`
  0% { transform: translateX(-45%); }
  50% { transform: translateX(15%); }
  100% { transform: translateX(72%); }
`

const terminalScan = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  18%, 68% { opacity: .26; }
  100% { transform: translateY(220%); opacity: 0; }
`

const softFloat = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -8px, 0); }
`

export default function UnderDevelopmentPage({
  title,
  description,
  backLabel,
  homeLabel,
  homeHref = '/',
  badgeLabel = 'Module status',
  progressLabel = 'Preparing workspace',
  terminalLines = [
    '> checking module status...',
    '> feature status: under development',
    '> estimated: coming soon'
  ]
}: UnderDevelopmentPageProps) {
  const router = useRouter()

  return (
    <Box
      sx={theme => ({
        minHeight: 'calc(100vh - 128px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, md: 4 },
        py: { xs: 5, md: 8 },
        background:
          theme.palette.mode === 'dark'
            ? `radial-gradient(circle at 18% 8%, ${alpha(theme.palette.primary.main, 0.22)} 0, transparent 34%),
               radial-gradient(circle at 86% 20%, ${alpha(theme.palette.info.main, 0.16)} 0, transparent 30%),
               linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.92)}, ${alpha(theme.palette.common.black, 0.58)})`
            : `radial-gradient(circle at 18% 8%, ${alpha(theme.palette.primary.light, 0.24)} 0, transparent 34%),
               radial-gradient(circle at 86% 20%, ${alpha(theme.palette.info.light, 0.18)} 0, transparent 30%),
               linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)}, ${alpha(theme.palette.primary.light, 0.1)})`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: theme.palette.mode === 'dark' ? 0.18 : 0.12,
          backgroundImage:
            `linear-gradient(${alpha(theme.palette.text.primary, 0.3)} 1px, transparent 1px),
             linear-gradient(90deg, ${alpha(theme.palette.text.primary, 0.3)} 1px, transparent 1px)`,
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(to bottom, transparent, #000 16%, #000 78%, transparent)'
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
            transition: 'none !important'
          }
        }
      })}
    >
      <Paper
        elevation={0}
        sx={theme => ({
          position: 'relative',
          width: '100%',
          maxWidth: 920,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.08fr .92fr' },
          gap: { xs: 4, md: 5 },
          alignItems: 'center',
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 0.9)}`,
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.78 : 0.92),
          backdropFilter: 'blur(18px)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? `0 28px 80px ${alpha(theme.palette.common.black, 0.34)}`
              : `0 28px 80px ${alpha(theme.palette.primary.dark, 0.12)}`,
          overflow: 'hidden'
        })}
      >
        <Box
          sx={theme => ({
            position: 'absolute',
            insetInlineStart: -80,
            insetBlockEnd: -110,
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            filter: 'blur(6px)'
          })}
        />

        <Stack spacing={3.5} sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Box
              sx={theme => ({
                width: 56,
                height: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                animation: `${softFloat} 4.8s ease-in-out infinite`
              })}
            >
              <TerminalIcon fontSize='medium' />
            </Box>
            <Chip
              size='small'
              icon={<CodeIcon />}
              label={badgeLabel}
              sx={theme => ({
                borderRadius: 1.5,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                '& .MuiChip-icon': { color: 'inherit' }
              })}
            />
          </Stack>

          <Box>
            <Typography
              variant='h3'
              sx={{
                fontWeight: 800,
                mb: 2,
                letterSpacing: 0,
                fontSize: { xs: '1.9rem', sm: '2.35rem', md: '2.75rem' },
                lineHeight: 1.18
              }}
            >
              {title}
              <Box
                component='span'
                sx={theme => ({
                  display: 'inline-block',
                  width: 10,
                  height: 30,
                  ml: 1,
                  mb: -0.5,
                  borderRadius: 0.5,
                  bgcolor: theme.palette.primary.main,
                  animation: `${cursorBlink} 1s steps(1) infinite`
                })}
              />
            </Typography>

            <Typography
              variant='body1'
              color='text.secondary'
              sx={{ maxWidth: 560, fontSize: { xs: '0.98rem', md: '1.05rem' }, lineHeight: 1.8 }}
            >
              {description}
            </Typography>
          </Box>

          <Box>
            <Stack direction='row' justifyContent='space-between' spacing={2} sx={{ mb: 1.25 }}>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                {progressLabel}
              </Typography>
              <Typography variant='caption' color='primary.main' sx={{ fontWeight: 700 }}>
                68%
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={68}
              sx={theme => ({
                height: 8,
                borderRadius: 99,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                overflow: 'hidden',
                '& .MuiLinearProgress-bar': {
                  position: 'relative',
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    width: '55%',
                    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.62)}, transparent)`,
                    animation: `${progressPulse} 2.4s ease-in-out infinite`
                  }
                }
              })}
            />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant='outlined'
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ minHeight: 42, borderRadius: 2, px: 2.5 }}
            >
              {backLabel}
            </Button>
            <Button
              variant='contained'
              startIcon={<HomeOutlinedIcon />}
              onClick={() => router.push(homeHref)}
              sx={{ minHeight: 42, borderRadius: 2, px: 2.5, boxShadow: 'none' }}
            >
              {homeLabel}
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={theme => ({
            position: 'relative',
            zIndex: 1,
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.black, 0.48)
                : alpha(theme.palette.grey[900], 0.94),
            boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.08)}`
          })}
        >
          <Box
            sx={theme => ({
              position: 'absolute',
              inset: 0,
              background:
                `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.primary.light, 0.14)} 48%, transparent 100%)`,
              animation: `${terminalScan} 5.5s linear infinite`,
              pointerEvents: 'none'
            })}
          />
          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            sx={theme => ({
              px: 2,
              py: 1.4,
              borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.12)}`
            })}
          >
            {['error', 'warning', 'success'].map(color => (
              <Box
                key={color}
                sx={theme => ({
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: theme.palette[color as 'error' | 'warning' | 'success'].main
                })}
              />
            ))}
            <Typography
              variant='caption'
              sx={{ color: 'grey.400', fontFamily: 'monospace', fontWeight: 700, ml: 1 }}
            >
              o24/module-loader
            </Typography>
          </Stack>

          <Stack spacing={1.6} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2.5, sm: 3 } }}>
            {terminalLines.map((line, index) => (
              <Typography
                key={`${line}-${index}`}
                variant='body2'
                sx={theme => ({
                  color: index === 1 ? theme.palette.success.light : alpha(theme.palette.common.white, 0.82),
                  fontFamily: 'monospace',
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  lineHeight: 1.7,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                })}
              >
                {line}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
