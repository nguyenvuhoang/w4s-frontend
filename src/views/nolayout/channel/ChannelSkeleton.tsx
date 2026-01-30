'use client'

import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material'
import type { getDictionary } from '@utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface ChannelSkeletonProps {
  dictionary: Dictionary
}

const ChannelSkeleton = ({ dictionary }: ChannelSkeletonProps) => {
  return (
    <Box p={5}>
      {/* Tabs Skeleton */}
      <Tabs value={0} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {[...Array(3)].map((_, idx) => (
          <Tab key={idx} label={<Skeleton width={150} />} disabled />
        ))}
      </Tabs>

      {/* Card Content Skeleton */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent>
          {/* Header with status and buttons */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Skeleton variant="text" width={250} height={32} />
            <Box display="flex" gap={1}>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>

          {/* Description */}
          <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />

          {/* Table Skeleton */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }}>
                  <Skeleton variant="text" width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={120} />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(7)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ChannelSkeleton

