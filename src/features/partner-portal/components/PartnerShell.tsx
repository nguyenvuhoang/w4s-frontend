'use client'

import HistoryIcon from '@mui/icons-material/History'
import LogoutIcon from '@mui/icons-material/Logout'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import { AppBar, BottomNavigation, BottomNavigationAction, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function PartnerShell({ children, active }: { children: React.ReactNode; active: 'scan' | 'history' }) {
  const router = useRouter()
  const partnerBase = '/vi/partner'
  return <Box sx={{ minHeight: '100dvh', bgcolor: '#07111f', color: 'common.white', pb: 10, fontFamily: 'var(--app-font-family)', '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiBottomNavigationAction-label': { fontFamily: 'var(--app-font-family)' } }}>
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(9,24,41,.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #263d56' }}>
      <Toolbar sx={{ maxWidth: 520, width: '100%', mx: 'auto' }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: '#5ce1a9', color: '#062116', mr: 1.5 }}><QrCodeScannerIcon /></Box>
        <Box sx={{ flex: 1 }}><Typography fontWeight={800}>IPS Partner</Typography><Typography variant="caption" sx={{ color: '#94a8bc' }}>ABC Coffee · Vientiane Center</Typography></Box>
        <IconButton color="inherit" aria-label="Đăng xuất" onClick={async () => { await fetch('/api/partner/auth/logout', { method: 'POST' }); router.replace(`${partnerBase}/login`); router.refresh() }}><LogoutIcon /></IconButton>
      </Toolbar>
    </AppBar>
    <Box component="main" sx={{ maxWidth: 520, mx: 'auto', px: 2.5, py: 3 }}>{children}</Box>
    <BottomNavigation value={active} onChange={(_, value) => router.push(`${partnerBase}/${value === 'history' ? 'history' : 'scan'}`)} sx={{ position: 'fixed', zIndex: 10, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 'min(100%, 520px)', bgcolor: 'rgba(9,24,41,.96)', borderTop: '1px solid #263d56', '& .MuiBottomNavigationAction-root': { color: '#94a8bc' }, '& .Mui-selected': { color: '#5ce1a9' } }}>
      <BottomNavigationAction label="Quét mã" value="scan" icon={<QrCodeScannerIcon />} />
      <BottomNavigationAction label="Lịch sử" value="history" icon={<HistoryIcon />} />
    </BottomNavigation>
  </Box>
}

export const PartnerHeading = ({ title, subtitle }: { title: string; subtitle: string }) => <Stack spacing={0.5} mb={2.5}><Typography variant="h4" fontWeight={800}>{title}</Typography><Typography sx={{ color: '#94a8bc' }}>{subtitle}</Typography></Stack>
