'use client'

import { useCallback, useMemo, useState } from 'react'

import CloseRounded from '@mui/icons-material/CloseRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import { REMIX_ICON_NAMES } from './remixIconNames.generated'

const INITIAL_VISIBLE_COUNT = 90
const LOAD_MORE_COUNT = 90
const SCROLL_LOAD_MORE_THRESHOLD_PX = 120

export type RemixIconPickerMessages = {
  title?: string
  searchPlaceholder?: string
  noResults?: string
  clearIcon?: string
  matchingCount?: (count: number) => string
}

type Props = {
  open: boolean
  onClose: () => void
  value: string
  onSelect: (icon: string) => void
  messages?: RemixIconPickerMessages
}

// The project's menu icons are Remix Icon classes (e.g. "ri-bar-chart-2-line"), rendered via
// MenuIcon (src/shared/components/GenerateMenu.tsx) as a plain `<i className={icon} />`. The
// full Remix Icon stylesheet is already loaded globally (clientcss.tsx), so this picker only
// needs the class name list (remixIconNames.generated.ts) to search/browse — no new icon
// library, no extra network fetch. Icons render incrementally (scroll-to-load-more) instead of
// all ~2,860 at once, same pattern as the project's existing (MUI-icon) IconPicker.
const RemixIconPicker = ({ open, onClose, value, onSelect, messages = {} }: Props) => {
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  const filteredIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) return REMIX_ICON_NAMES

    return REMIX_ICON_NAMES.filter(name => name.includes(normalized))
  }, [query])

  const visibleIcons = filteredIcons.slice(0, visibleCount)

  const handleSearchChange = (next: string) => {
    setQuery(next)
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_LOAD_MORE_THRESHOLD_PX) {
      setVisibleCount(current => Math.min(current + LOAD_MORE_COUNT, filteredIcons.length))
    }
  }, [filteredIcons.length])

  const handleClose = () => {
    setQuery('')
    setVisibleCount(INITIAL_VISIBLE_COUNT)
    onClose()
  }

  const handleSelect = (icon: string) => {
    onSelect(icon)
    handleClose()
  }

  const handleClear = () => {
    onSelect('')
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{messages.title ?? 'Chọn icon'}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseRounded />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder={messages.searchPlaceholder ?? 'Tìm icon theo tên...'}
            value={query}
            onChange={event => handleSearchChange(event.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchRounded fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }
            }}
          />
          {value && (
            <Button size="small" color="inherit" onClick={handleClear} sx={{ whiteSpace: 'nowrap' }}>
              {messages.clearIcon ?? 'Xóa icon'}
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {messages.matchingCount
            ? messages.matchingCount(filteredIcons.length)
            : `${filteredIcons.length.toLocaleString()} icon phù hợp`}
        </Typography>

        <Box onScroll={handleScroll} sx={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <Grid container spacing={1}>
            {visibleIcons.map(iconName => {
              const selected = iconName === value

              return (
                <Grid key={iconName} size={{ xs: 4, sm: 3, md: 2 }}>
                  <Tooltip title={iconName}>
                    <Paper
                      elevation={0}
                      onClick={() => handleSelect(iconName)}
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        bgcolor: selected ? 'action.selected' : 'background.paper',
                        '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
                      }}
                    >
                      <i className={iconName} style={{ fontSize: 24 }} />
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5, fontSize: '0.62rem', lineHeight: 1.2, wordBreak: 'break-word' }}
                      >
                        {iconName.replace(/^ri-/, '')}
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              )
            })}
          </Grid>

          {filteredIcons.length === 0 && (
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary">{messages.noResults ?? 'Không tìm thấy icon phù hợp'}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default RemixIconPicker
