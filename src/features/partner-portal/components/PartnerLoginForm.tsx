'use client'

import KeyIcon from '@mui/icons-material/Key'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PartnerLoginForm() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError('')
    const response = await fetch('/api/partner/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) })
    const result = await response.json(); setLoading(false)
    if (!response.ok) return setError(result.message ?? 'Mã truy cập không hợp lệ.')
    router.replace('/vi/partner/scan'); router.refresh()
  }
  return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: '#07111f', p: 2.5, fontFamily: 'var(--app-font-family)', '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiInputLabel-root': { fontFamily: 'var(--app-font-family)' } }}><Card sx={{ width: 'min(100%, 440px)', bgcolor: '#0e2035', color: 'common.white', border: '1px solid #263d56', borderRadius: 5 }}><CardContent sx={{ p: { xs: 3, sm: 4 } }}><Stack alignItems="center" spacing={1} mb={4}><Box sx={{ width: 70, height: 70, borderRadius: 4, bgcolor: '#5ce1a9', color: '#062116', display: 'grid', placeItems: 'center' }}><KeyIcon sx={{ fontSize: 36 }} /></Box><Typography variant="h4" fontWeight={800}>IPS Partner</Typography><Typography textAlign="center" sx={{ color: '#94a8bc' }}>Nhập mã truy cập được cấp khi tạo chương trình khuyến mãi</Typography></Stack><Stack component="form" spacing={2} onSubmit={submit}>{error && <Alert severity="error">{error}</Alert>}<TextField required name="code" label="Mã truy cập" autoComplete="one-time-code" inputProps={{ autoCapitalize: 'characters', spellCheck: false }} sx={fieldSx} /><Button disabled={loading} type="submit" size="large" variant="contained" sx={{ bgcolor: '#5ce1a9', color: '#062116', fontWeight: 800, '&:hover': { bgcolor: '#37bc83' } }}>{loading ? 'Đang kiểm tra…' : 'Tiếp tục'}</Button><Typography variant="caption" textAlign="center" sx={{ color: '#94a8bc' }}>Mỗi mã chỉ cho phép truy cập đúng đối tác và chương trình được cấp.</Typography></Stack></CardContent></Card></Box>
}
const fieldSx = { '& .MuiOutlinedInput-root': { color: 'white', bgcolor: '#091829', '& fieldset': { borderColor: '#263d56' } }, '& .MuiInputLabel-root': { color: '#94a8bc' } }
