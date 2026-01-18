'use client'

import JsonEditorComponent from '@/@core/components/jSONEditor'
import { Transaction } from '@/types/bankType'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'
import { getDictionary } from '@/utils/getDictionary'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ReceiptIcon from '@mui/icons-material/Receipt'
import RestoreIcon from '@mui/icons-material/Restore';
import {
    Box, Chip,
    Grid,
    Paper, Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { useMemo } from 'react'

const TransactionCoreAPIViewContent = ({
    session,
    dictionary,
    transactionnumber,
    viewdata
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    transactionnumber: string | undefined
    viewdata: Transaction
}) => {

    const parsedResponseBody = useMemo(() => {
        try {
            return JSON.parse(viewdata.response_body || '{}')
        } catch (e) {
            console.error('Invalid JSON in response_body:', e)
            return { error: 'Invalid JSON format' }
        }
    }, [viewdata.response_body])

    const parsedRequestBody = useMemo(() => {
        try {
            return JSON.parse(viewdata.request_body || '{}')
        } catch (e) {
            console.error('Invalid JSON in response_body:', e)
            return { error: 'Invalid JSON format' }
        }
    }, [viewdata.request_body])

    return (

        <ContentWrapper
            title={`${dictionary['transactioncoreapi'].title} - ${dictionary['common'].view}`}
            description={dictionary['transactioncoreapi'].description}
            icon={<ReceiptIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dataref={transactionnumber}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 4, width: '100%' }}>
                <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
                    {/* TRANSACTION INFO */}
                    <SectionCard title="Transaction Info" backgroundColor="#E6F4F1">
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, md: 6 }} >
                                <LabelText label={dictionary['transactioncoreapi'].transactioncode} value={viewdata.transaction_code || '-'} />
                                <LabelText label={dictionary['transactioncoreapi'].subcode} value={viewdata.sub_code || '-'} />
                                <LabelText label={dictionary['transactioncoreapi'].businesscode} value={viewdata.business_code || '-'} />
                                <LabelText label={dictionary['transactioncoreapi'].transactionid} value={viewdata.trans_id || '-'} />
                                <LabelText label={dictionary['transactioncoreapi'].transactiondate} value={formatDateTime(viewdata.transaction_date) || '-'} />
                                <LabelText label={"Customer CID"} value={viewdata.customer_cid || '-'} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LabelText label={dictionary['transactioncoreapi'].valuedate} value={formatDateTime(viewdata.value_date) || '-'} />
                                <LabelText label={dictionary['transactioncoreapi'].channel} value={viewdata.channel_id || '-'} />
                                <LabelText label={dictionary['transactioncoreapi'].refferenceid} value={viewdata.ref_id || '-'} />
                                <LabelText label={dictionary['common'].username} value={viewdata.login_name || '-'} />
                                <LabelText label={dictionary['common'].usercode} value={viewdata.user_code || '-'} />
                                <LabelText label={"Customer name"} value={viewdata.customer_name || '-'} />
                            </Grid>
                        </Grid>
                    </SectionCard>

                    {/* STATUS & RESULT */}
                    <SectionCard title="Status & Result" backgroundColor="#F5F5F5">
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LabelText label={dictionary['transactioncoreapi'].transactionamount} value={formatCurrency(viewdata.amount, viewdata.currency_code || "LAK")} />

                                <Typography sx={{ mt: 2 }}><strong>{dictionary['transactioncoreapi'].transactionstatus}:</strong></Typography>
                                <Chip
                                    label={viewdata.status === 'C' ? 'Success' : viewdata.status === 'R' ? 'Reversed' : 'Failed'}
                                    color={viewdata.status === 'C' ? 'success' : viewdata.status === 'R' ? 'secondary' : 'error'}
                                    icon={viewdata.status === 'C' ? <CheckCircleOutlineIcon /> : viewdata.status === 'R' ? <RestoreIcon/> : <CancelIcon />}
                                    sx={{ mt: 1 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LabelText
                                    label={dictionary['transactioncoreapi'].isreversed}
                                    value={
                                        viewdata.is_reverse ? (
                                            <CheckCircleOutlineIcon sx={{ color: 'success.main', verticalAlign: 'middle' }} />
                                        ) : (
                                            <CancelIcon sx={{ color: 'error.main', verticalAlign: 'middle' }} />
                                        )
                                    }
                                />
                                <LabelText
                                    label={dictionary['transactioncoreapi'].duration}
                                    value={
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            {(viewdata.duration / 1000).toFixed(2)} s
                                        </Box>
                                    }
                                />
                            </Grid>
                            <Grid size={12}>
                                <Typography sx={{ mt: 2 }}><strong>{dictionary['transactioncoreapi'].transactiondescription}</strong></Typography>
                                <Typography sx={{ color: '#555', whiteSpace: 'pre-wrap' }}>{viewdata.description}</Typography>
                            </Grid>
                        </Grid>
                    </SectionCard>

                    <SectionCard title="Error Details" backgroundColor="#FEF5F5">
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LabelText label="Error Code" value={viewdata.error_code || '-'} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LabelText label="Error Description" value={viewdata.error_desc || '-'} />
                            </Grid>
                        </Grid>
                    </SectionCard>

                    {/* TECHNICAL */}
                    <SectionCard title="Technical Info" backgroundColor="#FAFAFA">
                        <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>{dictionary['transactioncoreapi'].requestbody}</Typography>
                        <JsonEditorComponent
                            initialJson={parsedRequestBody}
                            onChange={() => { }}
                        />

                        <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>{dictionary['transactioncoreapi'].responsebody}</Typography>
                        <JsonEditorComponent
                            initialJson={parsedResponseBody}
                            onChange={() => { }}
                        />
                    </SectionCard>
                </Paper>



            </Box>
        </ContentWrapper>
    )
}

const SectionCard = ({
    title,
    children,
    backgroundColor = '#F9F9F9',
}: {
    title: string
    children: React.ReactNode
    backgroundColor?: string
}) => (
    <Box
        sx={{
            backgroundColor,
            borderRadius: 2,
            mb: 4,
            overflow: 'hidden',
            boxShadow: 1
        }}
    >
        <Box
            sx={{
                backgroundColor: '#225087',
                px: 3,
                py: 2
            }}
        >
            <Typography variant="h6" color="white" fontWeight="bold">
                {title}
            </Typography>
        </Box>
        <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
)

const LabelText = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <Typography sx={{ mb: 1 }}>
        <Box component="span" sx={{ fontWeight: 600, fontFamily: 'Quicksand' }}>
            {label}:
        </Box>{' '}
        <Box component="span" sx={{ fontWeight: 400, fontFamily: 'Quicksand' }}>
            {value}
        </Box>
    </Typography>
)

export default TransactionCoreAPIViewContent
