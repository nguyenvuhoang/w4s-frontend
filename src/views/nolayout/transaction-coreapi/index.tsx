'use client'

import { useEffect, useState } from 'react'
import {
    Box, Typography, Select, MenuItem, SelectChangeEvent, InputLabel, FormControl, Table,
    TableHead, TableBody, TableCell, TableRow, Paper, Button, LinearProgress,
    TextField, InputAdornment,
    TableContainer,
    Chip,
    TablePagination,
    CircularProgress
} from '@mui/material'
import { Session } from 'next-auth'
import { getDictionary } from '@/utils/getDictionary'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Transaction } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { dataService } from '@/servers/system-service'
import { formatDateTime } from '@/utils/formatDateTime'
import { formatCurrency } from '@/utils/formatCurrency'
import { useRouter } from 'next/navigation'

const TransactionCoreAPIContent = ({ session, dictionary, transactiondata }: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    transactiondata: PageData<Transaction>
}) => {
    const [channelFilter, setChannelFilter] = useState<string>('ALL')
    const [searchText, setSearchText] = useState<string>('')
    const [pageIndex, setPageIndex] = useState<number>(0)
    const [pagedData, setPagedData] = useState<PageData<Transaction>>(transactiondata)
    const [loading, setLoading] = useState<boolean>(false)

    const filtered = pagedData.items.filter(tx =>
        (channelFilter === 'ALL' || tx.channel_id === channelFilter) &&
        (searchText === '' || tx.transaction_number.includes(searchText))
    )


    const successCount = filtered.filter(tx => tx.status === 'C').length
    const failCount = filtered.filter(tx => tx.status !== 'C').length
    const total = filtered.length
    const successRate = total > 0 ? (successCount / total) * 100 : 0

    const handleChannelChange = (event: SelectChangeEvent) => {
        setChannelFilter(event.target.value)
    }

    useEffect(() => {
        const fetchPage = async (page: number) => {
            if (page === 0) return
            setLoading(true)
            const response = await dataService.searchSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `CBG_TRANSACTION_SEARCH`,
                searchtext: '',
                pageSize: 10,
                pageIndex: page
            })
            setPagedData(response.payload.dataresponse.data.input)
            setLoading(false)
        }

        fetchPage(pageIndex)
    }, [pageIndex, session])

    const router = useRouter()

    const handleRowDoubleClick = (tx: Transaction) => {
        router.push(`/transaction-coreapi/view/${tx.transaction_number}`)
    }


    return (
        <Box className="mt-5 space-y-5 w-full">
            {/* Status Bar */}
            <Box>
                <Typography variant="h6" className="mb-1">{dictionary['transactioncoreapi'].transactionsuccessrate}</Typography>
                <LinearProgress
                    variant="determinate"
                    value={successRate}
                    sx={{ height: 10, borderRadius: 5 }}
                    color={successRate >= 80 ? 'primary' : 'error'}
                />
                <Typography className="mt-2 text-sm text-gray-600">
                    {successCount} {dictionary['transactioncoreapi'].transactionresultsuccess} / {failCount} {dictionary['transactioncoreapi'].transactionresultfailed}
                </Typography>
            </Box>

            {/* Filters */}
                <Box className="flex gap-4 items-center">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>{dictionary['transactioncoreapi'].channel}</InputLabel>
                        <Select value={channelFilter} onChange={handleChannelChange} label="Channel">
                            <MenuItem value="ALL">{dictionary['common'].all}</MenuItem>
                            <MenuItem value="LDP">LDB</MenuItem>
                            <MenuItem value="BCEL">BCEL</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        placeholder="Search transaction..."
                        variant="outlined"
                        sx={{ width: 250 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#225087' }} />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                </Box>

                {/* Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#225087' /* xanh EMI */, '& th': { color: 'white', fontWeight: 'bold' } }}>
                                <TableCell>{dictionary['transactioncoreapi'].transactionid}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].transactioncode}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].transactiondate}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].transactionamount}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].transactionstatus}</TableCell>
                                <TableCell>{dictionary['common'].username}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].channel}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].transactionresultrefunded}</TableCell>
                                <TableCell>{dictionary['transactioncoreapi'].transactiondescription}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center">
                                        {dictionary['transactioncoreapi'].notransactionfound}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map(tx => (
                                    <TableRow
                                        key={tx.transaction_number}
                                        onDoubleClick={() => handleRowDoubleClick(tx)}
                                        sx={{ cursor: 'pointer' }}
                                        hover
                                    >
                                        <TableCell>{tx.transaction_number}</TableCell>
                                        <TableCell>{tx.transaction_code}</TableCell>
                                        <TableCell>{formatDateTime(tx.transaction_date)}</TableCell>
                                        <TableCell>{formatCurrency(tx.amount1, "LAK")}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={tx.status === 'C' ? <CheckIcon /> : <CloseIcon />}
                                                label={tx.status === 'C' ? 'Success' : 'Failed'}
                                                color={tx.status === 'C' ? 'primary' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{tx.user_name}</TableCell>
                                        <TableCell>{tx.channel_id}</TableCell>
                                        <TableCell>
                                            {tx.is_reverse && <CheckCircleOutlineIcon sx={{ color: '#225087' }} />}
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>

                    </Table>
                    {/* Pagination */}
                    <TablePagination
                        component="div"
                        count={pagedData?.total_count ?? 0}
                        page={pagedData?.page_index ?? 0}
                        onPageChange={(_, newPage) => setPageIndex(newPage)}
                        rowsPerPage={pagedData?.page_size ?? 10}
                        rowsPerPageOptions={[pagedData?.page_size ?? 10]}
                    />

                </TableContainer>
            </Box>
    )
}

export default TransactionCoreAPIContent
