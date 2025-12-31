'use client'

import { getDictionary } from '@/utils/getDictionary'
import {
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { Control } from 'react-hook-form'

type Props = {
    input: any
    control: Control<any>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    setValue: (name: string, value: any, options?: any) => void
}

const ViewPostingItem = ({ input, control, dictionary, setValue }: Props) => {
    // Demo dữ liệu, bạn có thể thay bằng input.debit / input.credit
    const debit = [
        { group: 1, account: '001-00-1101100-000-00001', amount: 123456.01 }
    ]
    const credit = [
        { group: 1, account: '001-00-2201100-000-00001', amount: 123456.01 }
    ]

    return (

        <Grid container spacing={2} >
            {/* Debit */}
            <Grid size={{ xs: 12, md: 6 }} >
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} align="center" >
                        {dictionary['posting']?.debit || 'Debit'}
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>Group</TableCell>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>Account number</TableCell>
                                    <TableCell align="right" sx={{ border: 1, borderColor: 'divider' }}>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {debit.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>{row.group}</TableCell>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>{row.account}</TableCell>
                                        <TableCell align="right" sx={{ border: 1, borderColor: 'divider' }}>
                                            {row.amount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

            {/* Credit */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} align="center" >
                        {dictionary['posting']?.credit || 'Credit'}
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>Group</TableCell>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>Account number</TableCell>
                                    <TableCell align="right" sx={{ border: 1, borderColor: 'divider' }}>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {credit.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>{row.group}</TableCell>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>{row.account}</TableCell>
                                        <TableCell align="right" sx={{ border: 1, borderColor: 'divider' }}>
                                            {row.amount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>
        </Grid>
    )
}

export default ViewPostingItem
