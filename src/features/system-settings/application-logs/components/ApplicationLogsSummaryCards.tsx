import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ErrorRounded from '@mui/icons-material/ErrorRounded'
import FormatListNumberedRounded from '@mui/icons-material/FormatListNumberedRounded'
import HubRounded from '@mui/icons-material/HubRounded'
import TimerRounded from '@mui/icons-material/TimerRounded'
import { Grid, Paper, Stack, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

import type { ApplicationLogSummary } from '../types'
import { applicationLogText, formatApplicationLogDuration } from './applicationLogHelpers'

type Props = {
  locale: string
  summary: ApplicationLogSummary
}

type CardMeta = {
  key: string
  label: string
  value: string
  icon: SvgIconComponent
  color: string
}

const ApplicationLogsSummaryCards = ({ locale, summary }: Props) => {
  const cards: CardMeta[] = [
    {
      key: 'total',
      label: applicationLogText(locale, 'Tổng số log', 'Total logs'),
      value: String(summary.totalCount),
      icon: FormatListNumberedRounded,
      color: 'primary.main'
    },
    {
      key: 'errors',
      label: applicationLogText(locale, 'Số log Error', 'Error logs'),
      value: String(summary.errorCount),
      icon: ErrorRounded,
      color: 'error.main'
    },
    {
      key: 'services',
      label: applicationLogText(locale, 'Số service tham gia', 'Services involved'),
      value: String(summary.serviceCount),
      icon: HubRounded,
      color: 'info.main'
    },
    {
      key: 'duration',
      label: applicationLogText(locale, 'Tổng thời gian xử lý', 'Total processing time'),
      value: formatApplicationLogDuration(summary.totalDurationMs),
      icon: TimerRounded,
      color: 'warning.main'
    },
    {
      key: 'status',
      label: applicationLogText(locale, 'Trạng thái cuối cùng', 'Final status'),
      value: summary.hasError
        ? applicationLogText(locale, 'Có lỗi', 'Has errors')
        : applicationLogText(locale, 'Thành công', 'Success'),
      icon: summary.hasError ? ErrorRounded : CheckCircleRounded,
      color: summary.hasError ? 'error.main' : 'success.main'
    }
  ]

  return (
    <Grid container spacing={2}>
      {cards.map(card => {
        const Icon = card.icon

        return (
          <Grid key={card.key} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Icon sx={{ color: card.color, fontSize: 32 }} />
                <Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.label}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ApplicationLogsSummaryCards
