'use client'

import { DashboardCustomizeRounded as DashboardIcon } from '@mui/icons-material'
import { Box, Card, CardContent, Chip, alpha, Typography, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

type DashboardPageContentProps = {
  dictionary?: {
    dashboardIps?: Record<string, string>
  }
}

const defaultText = {
  badge: 'Đang phát triển',
  title: 'Tính năng đang được phát triển',
  description: 'Hệ thống Dashboard đang được hoàn thiện và sẽ sớm được đưa vào sử dụng.'
}

const DashboardPageContent = ({ dictionary }: DashboardPageContentProps) => {
  const theme = useTheme()
  const text = { ...defaultText, ...(dictionary?.dashboardIps ?? {}) }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        bgcolor: theme.palette.mode === 'dark' ? '#0F172A' : '#F6F8FA'
      }}
    >
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        sx={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.4 : 0.7)}`,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(24, 34, 48, 0.92), rgba(15, 23, 42, 0.96))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 18px 40px rgba(0, 0, 0, 0.28)'
              : '0 16px 38px rgba(15, 23, 42, 0.06)'
        }}
      >
        <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
          <Box
            sx={{
              width: 88,
              height: 88,
              mx: 'auto',
              mb: 3,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}
          >
            <DashboardIcon sx={{ fontSize: 44 }} />
          </Box>
          <Chip
            label={text.badge}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: 1.5, mb: 2 }}
          />
          <Typography variant="h5" fontWeight={900} gutterBottom>
            {text.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            {text.description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default DashboardPageContent
