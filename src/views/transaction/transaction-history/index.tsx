'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import EmptyListNotice from '@components/layout/shared/EmptyListNotice'
import { Locale } from '@/configs/i18n'
import { SearchForm, useTransactionHistoryHandler } from '@/services/useTransactionHistoryHandler'
import { PageContentProps } from '@shared/types'
import { Transaction } from '@shared/types/bankType'
import { PageData } from '@shared/types/systemTypes'
import { getDictionary } from '@utils/getDictionary'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'
// date picker
import { formatAmount } from '@utils/formatAmount'
import { formatDateShort } from '@utils/formatDateShort'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@utils/formatDateTime'

type PageProps = PageContentProps & {
  transactionhistorydata: PageData<Transaction>
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  session: Session | null
  locale: Locale
}

const TransactionHistoryContent = ({ dictionary, transactionhistorydata, session, locale }: PageProps) => {
  const router = useRouter()

  const {
    transactions,
    page,
    jumpPage,
    rowsPerPage,
    totalCount,
    loading,
    handleSearch,
    handleJumpPage,
    handlePageChange,
    handlePageSizeChange,
    statusOptions,
    txTypeOptions
  } = useTransactionHistoryHandler(transactionhistorydata, session, locale)

  const { control, handleSubmit } = useForm<SearchForm>({
    defaultValues: {
      refnumber: '',
      transactionref: '',
      debitaccount: '',
      creditaccount: '',
      contractno: '',
      customername: '',
      cifnumber: '',
      license: '',
      fromdate: '',
      todate: '',
      status: 'ALL',
      transactiontype: 'ALL',
      schedule: false
    }
  })

  const onSubmit = (data: SearchForm) => handleSearch(data)

  // convenience getter with graceful fallbacks (because field names may vary)
  const g = (row: any, keys: string[]) => {
    for (const k of keys) {
      const v = row?.[k]
      if (v !== undefined && v !== null && `${v}`.length > 0) return v
    }
    return ''
  }

  const openTxDetail = (e: React.MouseEvent, refNumber: string) => {
    if (!refNumber) return
    const href = `/${locale}/form-view/transaction-view/${encodeURIComponent(refNumber)}`
    if (e.ctrlKey || e.metaKey) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      router.push(href)
    }
  }
  
  return (
    <Box sx={{ my: 5, width: '100%' }}>
      {/* Search form with fields like the screenshot */}
      <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} mb={3}>
            {/* Row 1 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="refnumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Ref.Number" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="transactionref"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Transaction ref" />
                )}
              />
            </Grid>

            {/* Row 2 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="debitaccount"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Debit account" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="creditaccount"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Credit account" />
                )}
              />
            </Grid>

            {/* Row 3 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="contractno"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Contract no" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="customername"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Customer name" />
                )}
              />
            </Grid>

            {/* Row 4 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="cifnumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Customer code in corebank"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="license"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="License" />
                )}
              />
            </Grid>

            {/* Row 5: dates */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="fromdate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="From date"
                    value={field.value ? dayjs(field.value, 'DD/MM/YYYY') : null}
                    format="DD/MM/YYYY"
                    onChange={val => field.onChange(val ? dayjs(val).format('DD/MM/YYYY') : '')}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                      openPickerButton: {
                        sx: {
                          '& .MuiSvgIcon-root': { color: '#225087 !important' }
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="todate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="To date"
                    value={field.value ? dayjs(field.value, 'DD/MM/YYYY') : null}
                    format="DD/MM/YYYY"
                    onChange={val => field.onChange(val ? dayjs(val).format('DD/MM/YYYY') : '')}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                      openPickerButton: {
                        sx: {
                          '& .MuiSvgIcon-root': { color: '#225087 !important' }
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Row 6: status + tx type */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth size="small" label="Status" select>
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="transactiontype"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Transaction type"
                    select
                  >
                    {txTypeOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Row 7: schedule + search button */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="schedule"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(_, checked) => field.onChange(checked)}
                        size="small"
                      />
                    }
                    label="Schedule"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                disabled={loading}
              >
                {dictionary.common?.search ?? 'Search'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
          <Table
            size="small"
            sx={{
              border: '1px solid #d0d0d0',
              fontSize: '15px',
              '& th, & td': {
                borderBottom: '1px solid #e0e0e0',
                paddingY: '12px',
                paddingX: '10px'
              },
              '& th': {
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: '#225087',
                color: 'white',
                whiteSpace: 'nowrap'
              },
              '& tbody tr:nth-of-type(odd)': { backgroundColor: '#fafafa' },
              '& tbody tr:hover': { backgroundColor: '#f1fdf5' }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>{dictionary['transaction'].refnumber}</TableCell>
                <TableCell>{dictionary['transaction'].date}</TableCell>
                <TableCell>{dictionary['transaction'].type}</TableCell>
                <TableCell>{dictionary['transaction'].debitaccount}</TableCell>
                <TableCell>{dictionary['transaction'].creditaccount}</TableCell>
                <TableCell>{dictionary['transaction'].amount}</TableCell>
                <TableCell>{dictionary['transaction'].fee}</TableCell>
                <TableCell>{dictionary['transaction'].currency}</TableCell>
                <TableCell>{dictionary['transaction'].errordescription}</TableCell>
                <TableCell>{dictionary['transaction'].description}</TableCell>
                <TableCell>{dictionary['transaction'].status}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                [...Array(rowsPerPage)].map((_, r) => (
                  <TableRow
                    key={`sk-${r}`}
                  >
                    {[...Array(12)].map((_, c) => (
                      <TableCell key={`skc-${r}-${c}`}>
                        <Skeleton variant="text" width="100%" height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12}>
                    <EmptyListNotice
                      message={dictionary.account?.nodatatransactionhistory ?? 'No data available'}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.items.map((row: any, i: number) => {
                  const refNumber = row.transactionid
                  const txDate = (row.transactiondate || '').toString()
                  const txType = row.transactiontype
                  const debitAcc = row.debitaccount
                  const creditAcc = row.creditaccount
                  const amount = row.amount
                  const fee = row.fee
                  const currency = row.currencycode
                  const errDesc = row.errordescription
                  const desc = row.description
                  return (
                    <TableRow key={`${refNumber}-${i}`} hover
                      onDoubleClick={(e) => openTxDetail(e, refNumber)}
                      sx={{ cursor: 'pointer' }}
                      title="Double-click to view details"
                    >
                      <TableCell>{refNumber}</TableCell>
                      <TableCell>{formatDateTime(txDate)}</TableCell>
                      <TableCell>{txType}</TableCell>
                      <TableCell>{debitAcc}</TableCell>
                      <TableCell>{creditAcc}</TableCell>
                      <TableCell>{formatAmount(amount)}</TableCell>
                      <TableCell>{formatAmount(fee)}</TableCell>
                      <TableCell>{currency}</TableCell>
                      <TableCell>{errDesc}</TableCell>
                      <TableCell>{desc}</TableCell>
                      <TableCell>
                        {row.status === 'COMPLETE' ? (
                          <Chip
                            icon={<CheckCircleIcon sx={{ color: '#4caf50 !important' }} />}
                            label="Complete"
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        ) : row.status === 'PENDING' ? (
                          <Chip
                            icon={<HourglassBottomIcon sx={{ color: '#ff9800 !important' }} />}
                            label="Pending"
                            color="warning"
                            variant="outlined"
                            size="small"
                          />
                        ) : row.status === 'FAILED' ? (
                          <Chip
                            icon={<CancelIcon sx={{ color: '#f44336 !important' }} />}
                            label="Failed"
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        ) : row.status === 'REVERSE' ? (
                          <Chip
                            icon={<CancelIcon sx={{ color: '#f44336 !important' }} />}
                            label="Reverse"
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<HelpOutlineIcon sx={{ color: '#9e9e9e !important' }} />}
                            label={row.status || 'Unknown'}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </TableCell>

                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalCount > 0 && (
          <Box 
            mt={5}
            sx={{
              '& .MuiPaginationItem-root.Mui-selected': {
                backgroundColor: '#225087 !important',
                color: 'white !important',
                fontWeight: 'bold !important',
              },
              '& .MuiPaginationItem-root.Mui-selected:hover': {
                backgroundColor: '#1780AC !important',
              }
            }}
          >
            <PaginationPage
              page={page}
              pageSize={rowsPerPage}
              totalResults={totalCount}
              jumpPage={jumpPage}
              handlePageChange={handlePageChange}
              handlePageSizeChange={handlePageSizeChange}
              handleJumpPage={handleJumpPage}
              dictionary={dictionary}
            />
          </Box>
        )}
      </Box>
  )
}

export default TransactionHistoryContent


