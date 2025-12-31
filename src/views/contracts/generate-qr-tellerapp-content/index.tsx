'use client'

import { useGenerateQRTeller } from '@/services/useGenerateQRTeller'
import { PageContentProps } from '@/types'
import { maskAccount } from '@/utils/maskAccount'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import QrCodeIcon from '@mui/icons-material/QrCode'
import {
    Alert, Box, Button, Card, CardContent, CircularProgress,
    FormControl, FormHelperText, Grid, MenuItem, Select,
    TextField, Typography,
} from '@mui/material'
import Image from 'next/image'

const transactions = [
    { id: 'DPT_CDP', name: '1110: Cash deposit' },
    { id: 'DPT_MDP', name: '1112: Miscellaneous deposit' },
    { id: 'DPT_CWR', name: '1120: Cash withdrawal' },
    { id: 'DPT_MWR', name: '1122: Miscellaneous withdrawal' },
    { id: 'DPT_DLS', name: '1190: Close deposit account by deposit' },
    { id: 'DPT_CLS', name: '1193: Close deposit account' },
    { id: 'DPT_MLS', name: '1191: Close deposit account by miscellaneous' },
    { id: 'DPT_TRF', name: '1130: Transfer from deposit account to deposit account' },
];


export default function GenerateQRTellerAppContent({ dictionary, session, locale }: PageContentProps) {
    const {
        transaction, accountNumber, qrCode, accountName,
        isLoading, error, txnError, acctError,
        frameRef,
        generateQR, sendEmail, downloadFramePng,
        onChangeTransaction, onChangeAccountNumber,
    } = useGenerateQRTeller({
        sessionToken: session?.user?.token as string,
        locale,
        dictionary,
    })
    const getTxnName = (id?: string) =>
        transactions.find(t => t.id === id)?.name ?? '';
    return (
        <ContentWrapper
            title={dictionary['QR'].title}
            description={dictionary['QR'].description}
            icon={<QrCodeIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 2, width: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom>
                    {dictionary['QR'].title}
                </Typography>

                <Grid container spacing={10}>
                    {/* Left form */}
                    <Grid size={{ xs: 12, md: 6 }} sx={{ border: '1px dashed red', borderRadius: 2 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        {dictionary['QR'].listoftransaction}
                                    </Typography>
                                    <FormControl fullWidth error={Boolean(txnError)}>
                                        <Select
                                            value={transaction}
                                            onChange={(e) => onChangeTransaction(e.target.value as string)}
                                            fullWidth
                                            displayEmpty
                                        >
                                            <MenuItem value="">{dictionary['QR'].choosetransaction}...</MenuItem>
                                            {transactions.map(t => (
                                                <MenuItem key={t.id} value={t.id}>{t.id} - {t.name}</MenuItem>
                                            ))}
                                        </Select>
                                        {txnError && <FormHelperText>{txnError}</FormHelperText>}
                                    </FormControl>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        {dictionary['QR'].accountnumber}
                                    </Typography>
                                    <TextField
                                        value={accountNumber}
                                        onChange={(e) => onChangeAccountNumber(e.target.value)}
                                        fullWidth
                                        placeholder={dictionary['QR'].accountnumber}
                                        variant="outlined"
                                        helperText={acctError}
                                        error={Boolean(acctError)}
                                    />
                                </Box>

                                {error && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}

                                <Button
                                    onClick={generateQR}
                                    disabled={isLoading || !transaction}
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                >
                                    {isLoading ? <CircularProgress size={24} /> : dictionary['QR'].generateqr}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right preview (khung gọn + export toàn khung) */}
                    <Grid size={{ xs: 12, md: 6 }} sx={{ border: '1px dashed green', borderRadius: 2 }}>
                        <Card elevation={0} sx={{ height: '100%', p: 3, bgcolor: 'transparent' }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Box
                                    ref={frameRef}
                                    sx={{
                                        width: '100%',
                                        maxWidth: 380,
                                        p: 1,
                                        borderRadius: 3,
                                        background:
                                            'linear-gradient(#1fb56a,#0a8e4d) padding-box, linear-gradient(180deg,#c8f3de,#0a8e4d) border-box',
                                        border: '3px solid transparent',
                                        boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            borderRadius: 2.5,
                                            bgcolor: '#fff',
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            minHeight: 0,
                                        }}
                                    >
                                        {transaction && (
                                            <Box
                                                sx={{
                                                    alignSelf: 'stretch',
                                                    mb: 0.5,
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1.5,
                                                    bgcolor: '#e8f7ef',
                                                    border: '1px solid rgba(16,122,66,0.2)',
                                                    display: 'flex',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                        color: '#0a8e4d',
                                                        textAlign: 'center',
                                                        lineHeight: 1.2,
                                                        px: 0.5
                                                    }}
                                                    title={`${transaction} - ${getTxnName(transaction)}`}
                                                >
                                                    {transaction} — {getTxnName(transaction)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {qrCode ? (
                                            <Image src={qrCode} alt="QR Code" width={210} height={210} style={{ borderRadius: 12 }} />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ my: 6 }}>
                                                {dictionary['QR'].noqrcode}
                                            </Typography>
                                        )}
                                        <Box sx={{ width: '100%', mt: 0.5, mb: 0.5, borderTop: '2px dotted #1aa25a' }} />
                                        <Typography
                                            sx={{
                                                fontFamily: '"Noto Sans Lao", system-ui, -apple-system, Segoe UI, Roboto',
                                                fontWeight: 700, fontSize: 16, color: '#144e2e',
                                                textAlign: 'center', lineHeight: 1.25, px: 1,
                                                maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}
                                            title={accountName}
                                        >
                                            {accountName || 'QR'}
                                        </Typography>
                                        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, color: '#6b6f76', letterSpacing: 1 }}>
                                            {maskAccount(accountNumber)}
                                        </Typography>
                                        <Box sx={{ alignSelf: 'flex-end', mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>

                            {qrCode && (
                                <Box sx={{ display: 'flex', gap: 5, width: '100%', mt: 1 }}>
                                    <Button
                                        onClick={downloadFramePng}
                                        fullWidth
                                        variant="contained"
                                        sx={{ bgcolor: '#107a42', minWidth: 'auto', p: 2, fontSize: '0.8rem' }}
                                        size="medium"
                                    >
                                        {dictionary['common'].download}
                                    </Button>
                                    <Button
                                        onClick={sendEmail}
                                        disabled={isLoading}
                                        fullWidth
                                        variant="contained"
                                        color="inherit"
                                        sx={{ minWidth: 'auto', p: 2, fontSize: '0.8rem' }}
                                        size="medium"
                                    >
                                        {isLoading ? <CircularProgress size={18} /> : dictionary['common'].sendemail}
                                    </Button>
                                </Box>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </ContentWrapper>
    )
}
