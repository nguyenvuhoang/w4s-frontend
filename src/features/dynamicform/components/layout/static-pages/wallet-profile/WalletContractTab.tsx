'use client';

import { PageContentProps } from '@/types';
import { formatDateTime } from '@/utils/formatDateTime';
import {
    Card,
    CardContent,
    Divider,
    Grid,
    Typography
} from '@mui/material';

interface WalletContractTabProps {
    walletData: any;
    dictionary: PageContentProps['dictionary'];
    session: PageContentProps['session'];
    locale: PageContentProps['locale'];
}

const WalletContractTab = ({
    walletData,
    dictionary,
    session,
    locale,
}: WalletContractTabProps) => {
    const labelStyle = {
        color: '#666666',
        fontSize: '0.75rem',
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        mb: 0.5,
    };

    const valueStyle = {
        fontWeight: 400,
        color: '#215086',
        fontSize: '1rem',
    };

    const contractData = walletData?.contract || {};

    console.log(contractData)

    return (
        <Card className="shadow-md" sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
                    {dictionary['wallet']?.contractInfo || 'Contract Information'}
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" sx={labelStyle}>
                            {dictionary['wallet']?.contractNumber || 'Contract Number'}
                        </Typography>
                        <Typography variant="body1" sx={valueStyle}>
                            {contractData?.contract_number || '-'}
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={labelStyle}>
                            {dictionary['wallet']?.contractType || 'Contract Type'}
                        </Typography>
                        <Typography variant="body1" sx={valueStyle}>
                            {contractData?.contract_type_caption || '-'}
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={labelStyle}>
                            {dictionary['wallet']?.contractStatus || 'Contract Status'}
                        </Typography>
                        <Typography variant="body1" sx={valueStyle}>
                            {contractData?.status || '-'}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" sx={labelStyle}>
                            {dictionary['wallet']?.startDate || 'Start Date'}
                        </Typography>
                        <Typography variant="body1" sx={valueStyle}>
                            {formatDateTime(contractData?.open_date_utc) || '-'}
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={labelStyle}>
                            {dictionary['wallet']?.endDate || 'End Date'}
                        </Typography>
                        <Typography variant="body1" sx={valueStyle}>
                            {walletData?.endDate || '-'}
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" sx={labelStyle}>
                            {dictionary['wallet']?.signedDate || 'Signed Date'}
                        </Typography>
                        <Typography variant="body1" sx={valueStyle}>
                            {formatDateTime(contractData?.open_date_utc) || '-'}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default WalletContractTab;
