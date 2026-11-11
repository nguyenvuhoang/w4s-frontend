import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import {
  Box,
  Chip,
  Paper,
  Skeleton,
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

import type { BannerDictionary, BannerItem } from '../types'
import {
  bannerText,
  commonText,
  displayBannerText,
  formatBannerEffectiveTime,
  getBannerActionTypeLabel,
  getBannerStatusColor,
  getBannerStatusLabel,
  getBannerTypeLabel
} from './bannerHelpers'

type Props = {
  dictionary: BannerDictionary
  rows: BannerItem[]
  loading: boolean
  pageIndex: number
  pageSize: number
  onOpenDetail: (row: BannerItem) => void
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
  maxWidth: 240
}

const nowrapCellSx = {
  whiteSpace: 'nowrap'
}

const columns = [
  'no',
  'image',
  'title',
  'project_code',
  'banner_type',
  'action_type',
  'effective_time',
  'display_order',
  'status'
] as const

const BannerThumbnail = ({ src, title }: { src: string; title: string }) => {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <Box
      sx={{
        width: 88,
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
          alt={title || 'banner'}
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

const BannerTable = ({ dictionary, rows, loading, pageIndex, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<BannerItem>({
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => row.id !== null && row.id !== undefined && row.id !== ''
    }
  })

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer>
      <Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column}
                sx={headerCellSx}
                align={column === 'display_order' ? 'right' : 'left'}
              >
                {column === 'no'
                  ? commonText(dictionary, 'nodot', 'No.')
                  : bannerText(dictionary, `field_${column}`, column)}
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
                  {bannerText(dictionary, 'empty_title', 'No matching banners found.')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => {
              return (
                <TableRow
                  key={`${row.project_id ?? row.project_code}-${row.id ?? index}`}
                  {...table.getRowProps(row)}
                >
                  <TableCell sx={nowrapCellSx}>{(pageIndex - 1) * pageSize + index + 1}</TableCell>
                  <TableCell sx={{ width: 112 }}>
                    <BannerThumbnail src={row.image_url} title={row.title} />
                  </TableCell>
                  <TableCell sx={textCellSx}>
                    <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                      {displayBannerText(row.title)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={nowrapCellSx}>{displayBannerText(row.project_code || row.project_id)}</TableCell>
                  <TableCell sx={textCellSx}>
                    <Chip size="small" variant="outlined" label={getBannerTypeLabel(dictionary, row.banner_type)} />
                  </TableCell>
                  <TableCell sx={textCellSx}>
                    <Chip size="small" variant="outlined" label={getBannerActionTypeLabel(dictionary, row.action_type)} />
                  </TableCell>
                  <TableCell sx={nowrapCellSx}>{formatBannerEffectiveTime(row.effective_from, row.effective_to)}</TableCell>
                  <TableCell sx={nowrapCellSx} align="right">{displayBannerText(row.display_order)}</TableCell>
                  <TableCell sx={nowrapCellSx}>
                    <Chip
                      size="small"
                      color={getBannerStatusColor(row.status)}
                      label={getBannerStatusLabel(dictionary, row.status)}
                    />
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

export default BannerTable
