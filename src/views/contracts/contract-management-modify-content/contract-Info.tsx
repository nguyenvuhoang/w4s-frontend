'use client'

import { LevelIcon } from '@/components/layout/shared/LevelIcon';
import { ContractTypeIcon } from '@/components/layout/shared/ContractTypeIcon';
import { StatusIcon } from '@/components/layout/shared/StatusIcon';
import { Contract } from '@/types/bankType';
import {
    Box,
    Card,
    CardContent,
    Grid as Grid,
    Typography
} from '@mui/material';

// Định nghĩa các field sẽ hiển thị với label tương ứng
const contractFields: { key: keyof Contract; label: string }[] = [
    { key: 'contractnumber', label: 'Contract Number' },
    { key: 'customercode', label: 'Customer Code' },
    { key: 'contracttypecaption', label: 'Contract Type' },
    { key: 'usertype', label: 'User Type' },
    { key: 'createdate', label: 'Create Date' },
    { key: 'enddate', label: 'End Date' },
    { key: 'usercreate', label: 'User Create' },
    { key: 'userapprove', label: 'User Approve' },
    { key: 'branchid', label: 'Branch ID' },
    { key: 'statuscaption', label: 'Status' },
    { key: 'contractlevelid', label: 'Contract Level ID' },
    { key: 'controltype', label: 'Control Type' },
];



const ContractInfo = ({ contractdata }: { contractdata: Contract }) => {
    return (
        <Card className="shadow-md">
            <CardContent>
                <Grid container spacing={5}>
                    {contractFields.map((field) => (
                        <Grid size={{ xs: 12, md: 6 }}
                            key={field.key}
                            sx={{
                                paddingLeft: 5,
                                paddingRight: 5,
                            }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1,
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
                                        {contractdata[field.key]?.toString() || '-'}
                                    </Typography>
                                    {field.key === 'statuscaption' && <StatusIcon status={contractdata.status} />}
                                    {field.key === 'contractlevelid' && <LevelIcon level={contractdata[field.key]} />}
                                    {field.key === 'contracttypecaption' && <ContractTypeIcon type={contractdata.contracttype} />
                                    }
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default ContractInfo;
