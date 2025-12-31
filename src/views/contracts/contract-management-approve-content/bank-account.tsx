'use client'

import { AccountTypeIcon } from '@/components/layout/shared/AccountTypeIcon'
import { PrimaryIcon } from '@/components/layout/shared/PrimaryIcon'
import { Contract, Contractaccount } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import {
    Box, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, Chip
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CancelIcon from '@mui/icons-material/Cancel'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

const accountFields: { key: keyof Contractaccount; label: string }[] = [
    { key: 'accountnumber', label: 'Account Number' },
    { key: 'accounttype', label: 'Account Type' },
    { key: 'currencycode', label: 'Currency Code' },
    { key: 'statuscaption', label: 'Status' },
    { key: 'isprimary', label: 'Primary' },
    { key: 'branchid', label: 'Branch ID' },
    { key: 'bankaccounttype', label: 'Bank Account Type' }
]

function getStatusChip(status?: string) {
    const s = (status || '').trim()

    if (['A', 'N', 'E'].some(k => s.includes(k))) {
        return { color: 'success' as const, icon: <CheckCircleIcon />, label: status }
    }
    if (['P', 'W', 'A'].some(k => s.includes(k))) {
        return { color: 'warning' as const, icon: <ScheduleIcon />, label: status }
    }
    if (['C', 'B', 'D'].some(k => s.includes(k))) {
        return { color: 'error' as const, icon: <CancelIcon />, label: status }
    }
    if (['G', 'D'].some(k => s.includes(k))) {
        return { color: 'error' as const, icon: <DeleteForeverIcon />, label: status }
    }
    return { color: 'default' as const, icon: <HelpOutlineIcon />, label: status || '-' }
}

const BankAccountInfo = ({
    contractdata,
    dictionary
}: {
    contractdata: Contract
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const accounts: Contractaccount[] = contractdata?.contractaccount || []

    return (
        <Card className='shadow-md'>
            <CardContent>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow className='bg-gray-100'>
                                {accountFields.map(field => (
                                    <TableCell key={field.key}>
                                        <Typography className='font-semibold text-gray-700'>{field.label}</Typography>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {accounts.length > 0 ? (
                                accounts.map((account, index) => (
                                    <TableRow key={index} className='hover:bg-gray-50'>
                                        {accountFields.map(field => (
                                            <TableCell key={field.key}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {field.key === 'accounttype' && (
                                                        <AccountTypeIcon type={account[field.key]} dictionary={dictionary} />
                                                    )}

                                                    {field.key === 'bankaccounttype' && (
                                                        <AccountTypeIcon type={account[field.key]} dictionary={dictionary} />
                                                    )}

                                                    {field.key === 'statuscaption' && (
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            {...getStatusChip(account.status)}
                                                            label={`${account.status ?? ''} - ${account.statuscaption ?? '-'}`}
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    )}


                                                    {field.key === 'isprimary' && (
                                                        <Typography className='font-medium text-primary mx-2'>
                                                            <PrimaryIcon isPrimary={account[field.key]} />
                                                        </Typography>
                                                    )}

                                                    {field.key !== 'accounttype' &&
                                                        field.key !== 'bankaccounttype' &&
                                                        field.key !== 'statuscaption' &&
                                                        field.key !== 'isprimary' && (
                                                            <Typography className='font-medium text-primary mx-2'>
                                                                {account[field.key]?.toString() || '-'}
                                                            </Typography>
                                                        )}
                                                </Box>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={accountFields.length} className='text-center'>
                                        <Typography className='text-gray-500'>
                                            {dictionary['account'].nobankaccount}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    )
}

export default BankAccountInfo
