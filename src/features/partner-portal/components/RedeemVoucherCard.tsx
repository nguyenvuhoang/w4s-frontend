'use client'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PartnerVoucher } from '../types'

export default function RedeemVoucherCard({ voucher }: { voucher: PartnerVoucher }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('')
  const redeem = async () => {
    if (!window.confirm('Xác nhận voucher này đã được sử dụng?')) return
    setLoading(true); setError('')
    const response = await fetch('/api/partner/vouchers/redeem', { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() }, body: JSON.stringify({ token: voucher.token }) })
    const result = await response.json(); setLoading(false)
    if (!response.ok) return setError(result.message ?? 'Không thể xác nhận voucher.')
    setDone(true)
  }
  return <Card sx={{ bgcolor: '#0e2035', color: 'common.white', border: '1px solid #263d56', borderRadius: 4 }}><CardContent sx={{ p: 3 }}>{done ? <Stack alignItems="center" textAlign="center" spacing={2} py={3}><CheckCircleIcon sx={{ fontSize: 76, color: '#5ce1a9' }} /><Typography variant="h5" fontWeight={800}>Xác nhận thành công</Typography><Typography sx={{ color: '#94a8bc' }}>Voucher đã được ghi nhận và không thể sử dụng lại.</Typography><Button fullWidth variant="contained" onClick={() => router.replace('/vi/partner/scan')}>Quét mã tiếp theo</Button></Stack> : <Stack spacing={2}><Chip label={voucher.status === 'AVAILABLE' ? 'CÓ THỂ SỬ DỤNG' : voucher.status} color={voucher.canRedeem ? 'success' : 'error'} sx={{ alignSelf: 'flex-start', fontWeight: 800 }} /><Typography variant="h5" fontWeight={800}>{voucher.promotionName}</Typography><Typography sx={{ color: '#94a8bc' }}>{voucher.discountDescription}</Typography><Divider sx={{ borderColor: '#263d56' }} />{[['Đối tác', voucher.partnerName], ['Cư dân', voucher.residentName], ['Hạn sử dụng', new Date(voucher.expiresAt).toLocaleString('vi-VN')]].map(([label, value]) => <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography sx={{ color: '#94a8bc' }}>{label}</Typography><Typography textAlign="right" fontWeight={600}>{value}</Typography></Box>)}{error && <Alert severity="error">{error}</Alert>}<Button size="large" variant="contained" disabled={!voucher.canRedeem || loading} onClick={redeem}>{loading ? 'Đang xác nhận…' : 'Xác nhận sử dụng'}</Button><Button size="large" variant="outlined" onClick={() => router.replace('/vi/partner/scan')}>Hủy và quét lại</Button></Stack>}</CardContent></Card>
}
