'use client'

import { CustomerTypeIcon } from '@/components/layout/shared/CustomerTypeIcon';
import { NationIcon } from '@/components/layout/shared/NationIcon';
import { SexIcon } from '@/components/layout/shared/SexIcon';
import { StatusIcon } from '@/components/layout/shared/StatusIcon';
import { Contract, Customer } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import StarIcon from '@mui/icons-material/Star';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid as Grid,
    Typography
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { useCustomerInfoHandler } from '@/services/useCustomerInfoHandler';
import { Session } from 'next-auth';
import SyncOverlay from '@/views/components/SyncOverlay';

// Định nghĩa các field sẽ hiển thị với label tương ứng
const customerFields: { key: keyof Customer; label: string }[] = [
    { key: 'custid', label: 'Customer Code' },
    { key: 'fullname', label: 'Full Name' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'addrresident', label: 'Address' },
    { key: 'sex', label: 'Sex' },
    { key: 'nation', label: 'Nation' },
    { key: 'tel', label: 'Telephone' },
    { key: 'email', label: 'Email' },
    { key: 'licensetypecaption', label: 'License Type' },
    { key: 'licenseid', label: 'License ID' },
    { key: 'issuedate', label: 'Issue Date' },
    { key: 'issueplace', label: 'Issue Place' },
    { key: 'branchid', label: 'Branch ID' },
    { key: 'statuscaption', label: 'Status' },
    { key: 'customertypecaption', label: 'Customer Type' },
    { key: 'cfcode', label: 'Core Banking Customer Code' },
    { key: 'phonecountrycode', label: 'Phone Country Code' },
    { key: 'kycid', label: 'KYC ID' },
    { key: 'usercreated', label: 'User Created' },
    { key: 'datecreated', label: 'Date Created' },
    { key: 'township', label: 'Township' },
    { key: 'region', label: 'Region' },
];



// Hàm chọn icon cho KYC ID Level (giả định level từ 1-5)
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

const CustomerInfo = ({ contractdata, dictionary, session }: { contractdata: Contract, dictionary: Awaited<ReturnType<typeof getDictionary>>, session: Session | null }) => {
    let customerdata: Customer;
    if (typeof contractdata?.customer_any === 'string') {
        customerdata = JSON.parse(contractdata.customer_any);
    } else {
        customerdata = contractdata?.customer_any || {} as Customer;
    }

    const { loading, handleSync } = useCustomerInfoHandler({ customerCode: customerdata.cfcode, customertype: customerdata.cftype, session, dictionary });
    return (
        <Card className="shadow-md">
            <CardContent>
                <Grid
                    container
                    spacing={8}
                    sx={{
                        '& > .MuiGrid-root': {
                            paddingLeft: 5,
                            paddingRight: 5,
                        }
                    }}
                >
                    {customerFields.map((field) => (
                        <Grid size={{ xs: 12, md: 6 }} key={field.key}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderRadius: 1,
                                    bgcolor: '#f5f5f5',
                                    '&:hover': {
                                        bgcolor: '#e8f5e9',
                                        transition: 'background-color 0.2s',
                                    },
                                }}
                            >
                                <Typography
                                    className="text-gray-600"
                                    sx={{ fontWeight: 'medium', minWidth: '150px' }}
                                >
                                    {field.label}:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flex: 1,
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <Typography
                                        className="font-medium text-primary mx-2"
                                        sx={{
                                            wordBreak: 'break-word',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {customerdata[field.key]?.toString() || '-'}
                                    </Typography>
                                    {field.key === 'sex' && <SexIcon sex={customerdata[field.key]} dictionary={dictionary} />}
                                    {field.key === 'nation' && <NationIcon nation={customerdata[field.key]} dictionary={dictionary} />}
                                    {field.key === 'statuscaption' && <StatusIcon status={customerdata.status} />}
                                    {field.key === 'kycid' && getKycLevelIcon(customerdata[field.key])}
                                    {field.key === 'customertypecaption' && <CustomerTypeIcon type={customerdata.cftype} />}

                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* 🔹 Thêm nút Sync ở đây */}
                {customerdata?.sourcetype !== 'WALLET' && (
                    <Box display="flex" justifyContent="flex-end" mt={5}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SyncIcon />}
                            onClick={() => handleSync()}
                        >
                            {dictionary['account'].synchronizecorebanking}
                        </Button>
                    </Box>
                )}
                {loading && (
                    <SyncOverlay open={loading} />
                )}

            </CardContent>
        </Card>
    );
};

export default CustomerInfo;
