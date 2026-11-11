'use client'

import { useState } from 'react'

import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import TroubleshootRounded from '@mui/icons-material/TroubleshootRounded'
import { Button, Collapse, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'

import type { ApplicationLogFilterModel } from '../types'
import ApplicationLogsFilterBar from './ApplicationLogsFilterBar'
import { applicationLogText } from './applicationLogHelpers'

type Props = {
  locale: string
  filter: ApplicationLogFilterModel
  loading: boolean
  onChange: <K extends keyof ApplicationLogFilterModel>(key: K, value: ApplicationLogFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const ApplicationLogsQuickSearch = ({ locale, filter, loading, onChange, onSearch, onReset }: Props) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSearch()
    }
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {applicationLogText(locale, 'Tra cứu nhanh', 'Quick lookup')}
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            value={filter.correlation_id}
            onChange={event => onChange('correlation_id', event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={applicationLogText(
              locale,
              'Dán Execution ID hoặc Correlation ID rồi nhấn Enter...',
              'Paste Execution ID or Correlation ID then press Enter...'
            )}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <TroubleshootRounded color="primary" />
                  </InputAdornment>
                )
              }
            }}
            sx={{
              '& .MuiInputBase-root': { fontSize: 18, fontFamily: 'monospace', height: 56 }
            }}
          />
          <Button
            variant="contained"
            size="large"
            startIcon={<TroubleshootRounded />}
            onClick={onSearch}
            disabled={loading}
            sx={{ minWidth: 160, whiteSpace: 'nowrap' }}
          >
            {applicationLogText(locale, 'Truy vết', 'Trace')}
          </Button>
        </Stack>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            size="small"
            color="inherit"
            onClick={() => setAdvancedOpen(current => !current)}
            endIcon={advancedOpen ? <ExpandLessRounded /> : <ExpandMoreRounded />}
          >
            {applicationLogText(locale, 'Bộ lọc nâng cao', 'Advanced filters')}
          </Button>
        </Stack>

        <Collapse in={advancedOpen} unmountOnExit>
          <ApplicationLogsFilterBar
            locale={locale}
            filter={filter}
            loading={loading}
            onChange={onChange}
            onSearch={onSearch}
            onReset={onReset}
          />
        </Collapse>
      </Stack>
    </Paper>
  )
}

export default ApplicationLogsQuickSearch
