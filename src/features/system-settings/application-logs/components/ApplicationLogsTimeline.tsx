import ArticleRounded from '@mui/icons-material/ArticleRounded'
import CallMadeRounded from '@mui/icons-material/CallMadeRounded'
import CallReceivedRounded from '@mui/icons-material/CallReceivedRounded'
import ReportRounded from '@mui/icons-material/ReportRounded'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator
} from '@mui/lab'
import { Chip, Paper, Stack, Typography } from '@mui/material'

import type { ApplicationLogItem } from '../types'
import {
  applicationLogText,
  formatApplicationLogDateTime,
  formatApplicationLogDuration,
  getApplicationLogDirectionMeta,
  getApplicationLogLevelMeta,
  isApplicationLogLevelError
} from './applicationLogHelpers'

type Props = {
  locale: string
  items: ApplicationLogItem[]
  firstErrorLogId: string | null
  onSelect: (item: ApplicationLogItem) => void
}

const DirectionIcon = ({ direction }: { direction: string | null }) => {
  const meta = getApplicationLogDirectionMeta(direction, 'en')

  if (meta.kind === 'in') return <CallReceivedRounded fontSize="small" />
  if (meta.kind === 'out') return <CallMadeRounded fontSize="small" />

  return <ArticleRounded fontSize="small" />
}

const ApplicationLogsTimeline = ({ locale, items, firstErrorLogId, onSelect }: Props) => {
  if (items.length === 0) return null

  return (
    <Paper sx={{ p: { xs: 1, md: 2 }, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, px: 1, pt: 1 }}>
        {applicationLogText(locale, 'Timeline luồng xử lý', 'Processing flow timeline')}
      </Typography>

      <Timeline
        sx={{
          '& .MuiTimelineItem-root:before': { flex: 0, padding: 0 }
        }}
      >
        {items.map((item, index) => {
          const levelMeta = getApplicationLogLevelMeta(item.log_level, locale)
          const directionMeta = getApplicationLogDirectionMeta(item.direction, locale)
          const isFirstError = item.id === firstErrorLogId
          const isLast = index === items.length - 1

          return (
            <TimelineItem key={item.id}>
              <TimelineOppositeContent sx={{ flex: 0.25, py: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {formatApplicationLogDateTime(item.log_timestamp, locale)}
                </Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot sx={{ bgcolor: levelMeta.dotColor }}>
                  <DirectionIcon direction={item.direction} />
                </TimelineDot>
                {!isLast && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent sx={{ py: 1.5 }}>
                <Paper
                  variant="outlined"
                  onClick={() => onSelect(item)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    borderColor: isFirstError ? 'error.main' : 'divider',
                    borderWidth: isFirstError ? 2 : 1,
                    bgcolor: isFirstError ? 'error.lighter' : 'background.paper',
                    '&:hover': { boxShadow: 2 }
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {item.service_name || '-'}
                    </Typography>
                    <Chip size="small" color={levelMeta.color} label={levelMeta.label} />
                    {item.log_type && <Chip size="small" variant="outlined" label={item.log_type} />}
                    {directionMeta.kind !== 'none' && (
                      <Chip size="small" variant="outlined" label={directionMeta.label} />
                    )}
                    {item.flow && (
                      <Typography variant="caption" color="text.secondary">
                        {item.flow}
                      </Typography>
                    )}
                    {isFirstError && (
                      <Chip
                        size="small"
                        color="error"
                        icon={<ReportRounded fontSize="small" />}
                        label={applicationLogText(locale, 'Nguyên nhân gốc', 'Root cause')}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {formatApplicationLogDuration(item.duration)}
                    </Typography>
                  </Stack>

                  {item.action_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {applicationLogText(locale, 'Action', 'Action')}: {item.action_name}
                    </Typography>
                  )}

                  {item.message && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: isApplicationLogLevelError(item.log_level) ? 'error.main' : 'text.primary'
                      }}
                    >
                      {item.message}
                    </Typography>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          )
        })}
      </Timeline>
    </Paper>
  )
}

export default ApplicationLogsTimeline
