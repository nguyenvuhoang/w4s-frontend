'use client'

import { Contract, Customer } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography
} from '@mui/material';
import { Session } from 'next-auth';
import StarIcon from '@mui/icons-material/Star';
import Image from 'next/image';

const kycFields: { key: keyof Customer; label: string }[] = [
    { key: 'kycid', label: 'KYC Level' },
    { key: 'licenseid', label: 'NRC Number' },
    { key: 'issuedate', label: 'Issue Date' },
    { key: 'issueplace', label: 'Issue Place' },
];

// Hàm chọn icon cho KYC ID Level
const getKycLevelIcon = (kycid: string | undefined) => {
    const level = parseInt(kycid || '0', 10);
    if (isNaN(level) || level < 1 || level > 5) return null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: level }, (_, index) => (
                <StarIcon key={index} sx={{ color: '#ffca28', fontSize: 20, mr: 0.5 }} />
            ))}
        </Box>
    );
};

const KYCInfo = ({ contractdata, dictionary, session }: { contractdata: Contract, dictionary: Awaited<ReturnType<typeof getDictionary>>, session: Session | null }) => {
    let customerdata: Customer;
    if (typeof contractdata?.customer_any === 'string') {
        customerdata = JSON.parse(contractdata.customer_any);
    } else {
        customerdata = contractdata?.customer_any || {} as Customer;
    }

    return (
        <Card className="shadow-md">
            <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
                    {dictionary['contract'].kycinformation || 'KYC Information'}
                </Typography>

                <Grid
                    container
                    spacing={8}
                    sx={{
                        '& > .MuiGrid-root': {
                            paddingLeft: 5,
                        }
                    }}
                >
                    {kycFields.map((field) => (
                        <Grid size={{ xs: 12, md: 6 }} key={field.key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 600,
                                        width: '40%',
                                        color: 'text.secondary',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {field.label}:
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 500,
                                            color: 'text.primary',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {customerdata[field.key] || 'N/A'}
                                    </Typography>
                                    {field.key === 'kycid' && getKycLevelIcon(customerdata[field.key])}
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* KYC Images Section */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
                        {dictionary['contract'].kycinformation || 'KYC'} Documents
                    </Typography>
                    <Grid container spacing={3}>
                        {contractdata?.documents && contractdata.documents.length > 0 ? (
                            contractdata.documents.map((doc) => {
                                // Determine document label based on documentcode
                                const getDocumentLabel = (code: string) => {
                                    switch (code) {
                                        case 'NF':
                                            return dictionary['contract'].nrcfront || 'NRC Front';
                                        case 'NB':
                                            return dictionary['contract'].nrcback || 'NRC Back';
                                        case 'SN':
                                            return dictionary['contract'].selfienrc || 'Selfie with NRC';
                                        default:
                                            return doc.documentname || code;
                                    }
                                };

                                return (
                                    <Grid size={{ xs: 12, md: 4 }} key={doc.id || doc.documentid}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                {getDocumentLabel(doc.documentcode)}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 2,
                                                    p: 2,
                                                    minHeight: 200,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: '#f5f5f5'
                                                }}
                                            >
                                                {doc.filecontent ? (
                                                    <Image
                                                        src={doc.filecontent}
                                                        alt={getDocumentLabel(doc.documentcode)}
                                                        width={300}
                                                        height={200}
                                                        style={{ objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No image available
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Grid>
                                );
                            })
                        ) : (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    No documents available
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );
};

export default KYCInfo;
