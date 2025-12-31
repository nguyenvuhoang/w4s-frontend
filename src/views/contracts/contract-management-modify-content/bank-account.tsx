'use client'

import { AccountTypeIcon } from '@/components/layout/shared/AccountTypeIcon';
import { PrimaryIcon } from '@/components/layout/shared/PrimaryIcon';
import { useUpdateBankAccountHandler } from '@/services/useUpdateBankAccountHandler';
import { Contract, Contractaccount } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import SyncOverlay from '@/views/components/SyncOverlay';
import { Global } from '@emotion/react';
import SyncIcon from '@mui/icons-material/Sync';
import {
    Box,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { Session } from 'next-auth';

const accountFields: { key: keyof Contractaccount; label: string }[] = [
    { key: 'accountnumber', label: 'Account Number' },
    { key: 'accounttype', label: 'Account Type' },
    { key: 'currencycode', label: 'Currency Code' },
    { key: 'statuscaption', label: 'Status' },
    { key: 'isprimary', label: 'Primary' },
    { key: 'branchid', label: 'Branch ID' },
    { key: 'bankaccounttype', label: 'Bank Account Type' },
];


const BankAccountInfo = ({ contractdata, dictionary, session, onSynced }: {
    contractdata: Contract,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    session: Session | null
    onSynced?: (accounts: Contractaccount[]) => void
}) => {

    const accounts: Contractaccount[] = contractdata?.contractaccount || [];
    const { loading, handleSync, } = useUpdateBankAccountHandler({ contract: contractdata, session, dictionary, onAfterSync: onSynced });

    return (
        <>
            <Global
                styles={{
                    '@keyframes spin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                    },
                    '@keyframes syncMove': {
                        '0%': { left: '-30%' },
                        '50%': { left: '100%' },
                        '100%': { left: '-30%' },
                    },
                }}
            />

            <Card className="shadow-md">
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow className="bg-gray-100">
                                    {accountFields.map((field) => (
                                        <TableCell key={field.key}>
                                            <Typography className="font-semibold text-gray-700">
                                                {field.label}
                                            </Typography>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.length > 0 ? (
                                    accounts.map((account, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50">
                                            {accountFields.map((field) => (
                                                <TableCell key={field.key}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {field.key !== 'accounttype' && field.key !== 'bankaccounttype' && (
                                                            <Typography className="font-medium text-primary mx-2">
                                                                {field.key === 'isprimary' ? (
                                                                    <PrimaryIcon isPrimary={account[field.key]} />
                                                                ) : (
                                                                    account[field.key]?.toString() || '-'
                                                                )}
                                                            </Typography>
                                                        )}
                                                        {field.key === 'accounttype' && (
                                                            <AccountTypeIcon type={account[field.key]} dictionary={dictionary} />
                                                        )}
                                                        {field.key === 'bankaccounttype' && (
                                                            <AccountTypeIcon type={account[field.key]} dictionary={dictionary} />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={accountFields.length} className="text-center">
                                            <Typography className="text-gray-500">
                                                {dictionary['account'].nobankaccount}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
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
                    {loading && (
                        <SyncOverlay open={loading} />
                    )}


                </CardContent>
            </Card>
        </>
    );
};

export default BankAccountInfo;
