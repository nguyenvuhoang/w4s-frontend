'use client'

import { usePostingHandler } from '@/services/usePostingHandler'
import { getDictionary } from '@utils/getDictionary'
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
import { Session } from 'next-auth'
import { Control, UseFormGetValues } from 'react-hook-form'
import { useMemo } from 'react'

type Props = {
    input: any
    control: Control<any>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
}

const ViewPostingItem = ({ input, control, dictionary, session }: Props) => {
    const { loading, postingData } = usePostingHandler({
        session,
        txrefid: input.value,
        dictionary
    })

    // TÃ¡ch debit / credit tá»« postingData
    const debit = useMemo(
        () => (postingData || []).filter(x => x.dorc === 'D'),
        [postingData]
    )

    const credit = useMemo(
        () => (postingData || []).filter(x => x.dorc === 'C'),
        [postingData]
    )

    const formatAmount = (value: number | null | undefined) => {
        const num = Number(value ?? 0)
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    return (
        <Grid container spacing={2}>
            {/* Debit */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant='outlined' sx={{ p: 2 }}>
                    <Typography
                        variant='subtitle1'
                        gutterBottom
                        fontWeight={600}
                        align='center'
                    >
                        {dictionary['posting']?.debit || 'Debit'}
                    </Typography>

                    <TableContainer>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>Group</TableCell>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>
                                        Account number
                                    </TableCell>
                                    <TableCell
                                        align='right'
                                        sx={{ border: 1, borderColor: 'divider' }}
                                    >
                                        Amount
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && debit.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align='center'
                                            sx={{ border: 1, borderColor: 'divider' }}
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && debit.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align='center'
                                            sx={{ border: 1, borderColor: 'divider' }}
                                        >
                                            No debit data
                                        </TableCell>
                                    </TableRow>
                                )}

                                {debit.map((row, i) => (
                                    <TableRow key={`${row.txrefid}-D-${row.acidx}-${i}`}>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>
                                            {row.acgrp?.toString().trim?.() ?? row.acgrp}
                                        </TableCell>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>
                                            {row.acno}
                                        </TableCell>
                                        <TableCell
                                            align='right'
                                            sx={{ border: 1, borderColor: 'divider' }}
                                        >
                                            {formatAmount(row.debit_amount ?? row.amount)}
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
                <Paper variant='outlined' sx={{ p: 2 }}>
                    <Typography
                        variant='subtitle1'
                        gutterBottom
                        fontWeight={600}
                        align='center'
                    >
                        {dictionary['posting']?.credit || 'Credit'}
                    </Typography>

                    <TableContainer>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>Group</TableCell>
                                    <TableCell sx={{ border: 1, borderColor: 'divider' }}>
                                        Account number
                                    </TableCell>
                                    <TableCell
                                        align='right'
                                        sx={{ border: 1, borderColor: 'divider' }}
                                    >
                                        Amount
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && credit.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align='center'
                                            sx={{ border: 1, borderColor: 'divider' }}
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && credit.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align='center'
                                            sx={{ border: 1, borderColor: 'divider' }}
                                        >
                                            No credit data
                                        </TableCell>
                                    </TableRow>
                                )}

                                {credit.map((row, i) => (
                                    <TableRow key={`${row.txrefid}-C-${row.acidx}-${i}`}>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>
                                            {row.acgrp?.toString().trim?.() ?? row.acgrp}
                                        </TableCell>
                                        <TableCell sx={{ border: 1, borderColor: 'divider' }}>
                                            {row.acno}
                                        </TableCell>
                                        <TableCell
                                            align='right'
                                            sx={{ border: 1, borderColor: 'divider' }}
                                        >
                                            {formatAmount(row.credit_amount ?? row.amount)}
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

