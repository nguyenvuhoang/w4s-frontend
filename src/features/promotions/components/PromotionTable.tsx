import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useState } from 'react'

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { PromotionDictionary, PromotionItem } from '../types'
import {
  displayPromotionText,
  formatPromotionValidPeriod,
  getPromotionLifecycleColor,
  getPromotionLifecycleLabel,
  getPromotionLifecycleStatus,
  getPromotionStatusColor,
  getPromotionStatusLabel,
  promotionText
} from './promotionHelpers'

type Props = {
  dictionary: PromotionDictionary
  rows: PromotionItem[]
  loading: boolean
  pageSize: number
  onOpenDetail: (row: PromotionItem) => void
}

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const textCellSx = {
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  lineHeight: 1.45,
  maxWidth: 260
}

const nowrapCellSx = {
  whiteSpace: 'nowrap'
}

const columns = [
  'image',
  'promotion_code',
  'promotion',
  'partner_name',
  'voucher_code',
  'valid_period',
  'display_order',
  'status'
] as const

const PromotionThumbnail = ({ src, title }: { src: string; title: string }) => {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <Box
      sx={{
        width: 72,
        height: 52,
        borderRadius: 1,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={src}
          alt={title || 'promotion'}
          onError={() => setFailed(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <ImageNotSupportedOutlinedIcon color="disabled" fontSize="small" />
      )}
    </Box>
  )
}

const PromotionTable = ({ dictionary, rows, loading, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<PromotionItem>({
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => row.id !== null && row.id !== undefined && row.id !== ''
    }
  })

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer>
      <Table stickyHeader size="small" sx={{ minWidth: 1160 }}>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column}
                sx={headerCellSx}
                align={column === 'display_order' ? 'right' : 'left'}
              >
                {promotionText(dictionary, `field_${column}`, column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: pageSize }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map(column => <TableCell key={column}><Skeleton height={column === 'image' ? 52 : 28} /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {promotionText(dictionary, 'empty_title', 'No matching promotions found.')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => {
              const lifecycle = getPromotionLifecycleStatus(row.valid_from, row.valid_to)

              return (
                <TableRow
                  key={`${row.promotion_code}-${row.id ?? index}`}
                  {...table.getRowProps(row)}
                >
                  <TableCell sx={{ width: 96 }}>
                    <PromotionThumbnail src={row.image_url} title={row.title} />
                  </TableCell>
                  <TableCell sx={nowrapCellSx}>
                    <Typography sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      {displayPromotionText(row.promotion_code)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={textCellSx}>
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                        {displayPromotionText(row.title)}
                      </Typography>
                      {row.summary && (
                        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                          {row.summary}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={textCellSx}>{displayPromotionText(row.partner_name)}</TableCell>
                  <TableCell sx={nowrapCellSx}>{displayPromotionText(row.voucher_code)}</TableCell>
                  <TableCell sx={nowrapCellSx}>{formatPromotionValidPeriod(row.valid_from, row.valid_to)}</TableCell>
                  <TableCell sx={nowrapCellSx} align="right">{displayPromotionText(row.display_order)}</TableCell>
                  <TableCell sx={nowrapCellSx}>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Chip
                        size="small"
                        color={getPromotionStatusColor(row.status)}
                        label={getPromotionStatusLabel(dictionary, row.status)}
                      />
                      {lifecycle !== 'unknown' && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color={getPromotionLifecycleColor(lifecycle)}
                          label={getPromotionLifecycleLabel(dictionary, lifecycle)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  )
}

export default PromotionTable
