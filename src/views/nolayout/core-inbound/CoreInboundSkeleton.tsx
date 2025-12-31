'use client'

import { Box, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface CoreInboundSkeletonProps {
  dictionary: Dictionary
}

const CoreInboundSkeleton = ({ dictionary }: CoreInboundSkeletonProps) => {
  return (
    <Box p={5}>
      {/* Search Field */}
      <Box display="flex" alignItems="center" gap={4} mb={4}>
        <TextField
          disabled
          size="small"
          placeholder="Search by Execution ID"
          sx={{ width: '250px' }}
        />
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={120} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(10)].map((_, index) => (
              <TableRow key={index}>
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
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 2 }} />
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
      </TableContainer>

      {/* Pagination Skeleton */}
      <Box mt={5} display="flex" justifyContent="center" alignItems="center" gap={2}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="rectangular" width={300} height={32} sx={{ borderRadius: 2 }} />
        <Skeleton variant="text" width={100} />
      </Box>
    </Box>
  )
}

export default CoreInboundSkeleton
