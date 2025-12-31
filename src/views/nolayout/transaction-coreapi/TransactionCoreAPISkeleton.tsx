'use client'

import { Box, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface TransactionCoreAPISkeletonProps {
  dictionary: Dictionary
}

const TransactionCoreAPISkeleton = ({ dictionary }: TransactionCoreAPISkeletonProps) => {
  return (
    <Box p={5}>
      {/* Status Bar */}
      <Box mb={4}>
        <Typography variant="h6" className="mb-1">
          <Skeleton variant="text" width={250} />
        </Typography>
        <LinearProgress variant="determinate" value={0} sx={{ height: 10, borderRadius: 5 }} />
        <Typography className="mt-2 text-sm text-gray-600">
          <Skeleton variant="text" width={200} />
        </Typography>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={4} alignItems="center" mb={4}>
        <FormControl size="small" sx={{ minWidth: 150 }} disabled>
          <InputLabel>{dictionary['transactioncoreapi'].channel}</InputLabel>
          <Select value="ALL" label="Channel">
            <MenuItem value="ALL">{dictionary['common'].all}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          disabled
          size="small"
          placeholder="Search transaction..."
          sx={{ width: '250px' }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell key="header-0">
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell key="header-1">
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell key="header-2">
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell key="header-3">
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell key="header-4">
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell key="header-5">
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell key="header-6">
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell key="header-7">
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell key="header-8">
                <Skeleton variant="text" width={120} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(10)].map((_, index) => (
              <TableRow key={`skeleton-row-${index}`}>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 2 }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="circular" width={24} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={0}
          page={0}
          onPageChange={() => {}}
          rowsPerPage={10}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>
    </Box>
  )
}

export default TransactionCoreAPISkeleton
