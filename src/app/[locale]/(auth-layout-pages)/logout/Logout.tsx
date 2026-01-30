import { Locale } from '@/configs/i18n'
import LogoutLogic from '@features/auth/hooks/useLogout'
import { getDictionary } from '@utils/getDictionary'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import {
  Box,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import Image from 'next/image'

const Logout = ({
  locale,
  dictionary
}: {
  locale: Locale
  dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {

  const t = dictionary['common'] || {}
  const loggingOutText = `${t.logout || 'Logging out'}`
  const pleaseWait = t.pleasewaitamoment || 'Please wait a moment. The system is processing your logout securely.'

  return (
    <Box
      aria-busy
      role="status"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        overflow: 'auto',
        // Animated gradient background
        background:
          'radial-gradient(1200px 600px at 10% -10%, #b3e5fc 0%, transparent 60%), radial-gradient(800px 500px at 120% 10%, #c8e6c9 0%, transparent 60%), linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          background:
            'linear-gradient(120deg, rgba(3,73,42,0.08), rgba(4,141,72,0.06))',
          animation: 'sheen 6s linear infinite'
        },
        '@keyframes sheen': {
          '0%': { opacity: 0.4 },
          '50%': { opacity: 0.6 },
          '100%': { opacity: 0.4 }
        }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1300,
          width: '100%',
          maxWidth: '96vw',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(3,73,42,0.08)',
          boxShadow:
            '0 10px 30px rgba(3,73,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          overflow: 'hidden',
          margin: 'auto'
        }}
      >
        <Stack spacing={5} alignItems="center">
          <Image
            src="/images/illustrations/logout.webp"
            alt="Logging out"
            width={400}
            height={400}
            priority
            style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.08))' }}
          />

          <Stack spacing={1} alignItems="center">
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: 0.2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LogoutRoundedIcon fontSize="small" />
              {loggingOutText}
              <DotDotDot />
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 520 }}>
              {pleaseWait}
            </Typography>
          </Stack>

          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress sx={{ borderRadius: 999 }} />
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            divider={<Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />}
            sx={{
              mt: 0.5,
              px: { xs: 1, sm: 2 },
              width: '100%',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <Tip icon={<LockRoundedIcon fontSize="small" />} text="Ending secure session" />
            <Tip icon={<CheckCircleRoundedIcon fontSize="small" />} text="Clearing app state" />
            <Tip icon={<CheckCircleRoundedIcon fontSize="small" />} text="Redirecting safely" />
          </Stack>

          {/* Mount logout logic (performs signout and redirect) */}
          <LogoutLogic locale={locale} />

        </Stack>
      </Paper>
    </Box>
  )
}

const Tip = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
    <Box sx={{ display: 'grid', placeItems: 'center' }}>{icon}</Box>
    <Typography variant="caption" color="text.secondary">
      {text}
    </Typography>
  </Stack>
)

const DotDotDot = () => (
  <Box
    component="span"
    sx={{
      ml: 0.2,
      display: 'inline-flex',
      gap: 0.3,
      verticalAlign: 'middle',
      '& > i': {
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        opacity: 0.6,
        animation: 'blink 1.4s infinite'
      },
      '& > i:nth-of-type(2)': { animationDelay: '0.2s' },
      '& > i:nth-of-type(3)': { animationDelay: '0.4s' },
      '@keyframes blink': {
        '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
        '40%': { transform: 'scale(1)', opacity: 1 }
      }
    }}
  >
    <i />
    <i />
    <i />
  </Box>
)

export default Logout
