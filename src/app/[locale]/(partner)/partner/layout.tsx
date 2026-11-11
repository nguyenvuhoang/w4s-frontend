import type { Metadata, Viewport } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'

export const metadata: Metadata = {
  title: { default: 'IPS Partner', template: '%s | IPS Partner' },
  description: 'Cổng xác nhận ưu đãi dành cho đối tác IPS',
  manifest: '/partner-manifest.webmanifest',
  appleWebApp: { capable: true, title: 'IPS Partner', statusBarStyle: 'black-translucent' }
}

export const viewport: Viewport = { themeColor: '#0b1f36', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ prepend: true }}>
      {children}
    </AppRouterCacheProvider>
  )
}
