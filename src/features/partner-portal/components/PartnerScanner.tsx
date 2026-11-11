'use client'

import CameraAltIcon from '@mui/icons-material/CameraAlt'
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function PartnerScanner() {
  const router = useRouter()
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null)
  const lockedRef = useRef(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const stop = async () => { try { await scannerRef.current?.stop() } catch {} scannerRef.current?.clear(); scannerRef.current = null; setRunning(false) }
  const start = async () => {
    setError(''); lockedRef.current = false
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('partner-qr-reader')
      scannerRef.current = scanner
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: (width, height) => { const size = Math.min(width, height, 280); return { width: size, height: size } }, aspectRatio: 1 }, async decodedText => {
        if (lockedRef.current) return
        lockedRef.current = true
        await stop()
        let token = decodedText.trim()
        try { const url = new URL(token); token = url.searchParams.get('v') ?? url.pathname.split('/').filter(Boolean).pop() ?? token } catch { token = token.replace(/^IPS-VOUCHER:/i, '') }
        router.push(`/vi/partner/redeem/${encodeURIComponent(token)}`)
      }, () => undefined)
      setRunning(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể mở camera. Vui lòng kiểm tra quyền camera và HTTPS.') }
  }
  useEffect(() => () => { void stop() }, [])

  return <Card sx={{ bgcolor: '#0e2035', color: 'common.white', border: '1px solid #263d56', borderRadius: 4, overflow: 'hidden' }}><CardContent sx={{ p: 1.5 }}>
    {!running && <Stack alignItems="center" textAlign="center" spacing={2} sx={{ px: 2, py: 6 }}><Box sx={{ width: 78, height: 78, borderRadius: 4, border: '2px solid #5ce1a9', color: '#5ce1a9', display: 'grid', placeItems: 'center' }}><CameraAltIcon sx={{ fontSize: 38 }} /></Box><Typography variant="h6" fontWeight={800}>Sẵn sàng quét QR</Typography><Typography sx={{ color: '#94a8bc' }}>Đưa mã QR của cư dân vào giữa khung hình</Typography>{error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}<Button fullWidth size="large" variant="contained" onClick={start} sx={{ bgcolor: '#5ce1a9', color: '#062116', fontWeight: 800, '&:hover': { bgcolor: '#37bc83' } }}>Mở camera</Button></Stack>}
    <Box id="partner-qr-reader" sx={{ overflow: 'hidden', borderRadius: 3, '& video': { objectFit: 'cover' } }} />
  </CardContent></Card>
}
