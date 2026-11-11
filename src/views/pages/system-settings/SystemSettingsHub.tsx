'use client'

import { useState } from 'react'

import SearchRounded from '@mui/icons-material/SearchRounded'
import { Box, Grid, InputAdornment, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'

import SystemSettingCard from './SystemSettingCard'
import type { SystemSettingsDictionary, SystemSettingsGroupKey } from './systemSettingsModules'
import { useSystemSettingsHub } from './useSystemSettingsHub'

type SystemSettingsHubProps = {
  dictionary: SystemSettingsDictionary
}

const hubText = (
  dictionary: SystemSettingsDictionary,
  key: string,
  replacements?: Record<string, string | number>
) => {
  const text = dictionary.system_settings_modules?.[key] ?? key

  return Object.entries(replacements ?? {}).reduce(
    (value, [replaceKey, replaceValue]) => value.replace(`{${replaceKey}}`, String(replaceValue)),
    text
  )
}

const SystemSettingsHub = ({ dictionary }: SystemSettingsHubProps) => {
  const { searchValue, setSearchValue, groups, totalModules, handleOpenModule } = useSystemSettingsHub(dictionary)

  // Holds the user's last explicit tab pick. Groups can disappear when a search filters out all
  // of their modules, so the active tab actually used for rendering is re-derived below instead
  // of trusting this value directly — that keeps the tab bar from pointing at a group that no
  // longer has a matching card, without needing an effect to correct it.
  const [selectedGroupKey, setSelectedGroupKey] = useState<SystemSettingsGroupKey | null>(null)

  const activeGroupKey = groups.some(group => group.key === selectedGroupKey)
    ? selectedGroupKey
    : (groups[0]?.key ?? null)

  const activeGroup = groups.find(group => group.key === activeGroupKey)

  return (
    <Stack spacing={5}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
        <Box sx={{ maxWidth: 820 }}>
          <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
            {hubText(dictionary, 'hub_title')}
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.65 }}>
            {hubText(dictionary, 'hub_description')}
          </Typography>
        </Box>

        <TextField
          value={searchValue}
          onChange={event => setSearchValue(event.target.value)}
          placeholder={hubText(dictionary, 'hub_search_placeholder')}
          size='small'
          sx={{ width: { xs: '100%', md: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchRounded fontSize='small' />
                </InputAdornment>
              )
            }
          }}
        />
      </Stack>

      {groups.length > 0 && (
        <Paper variant='outlined' sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeGroupKey}
            onChange={(_event, nextValue: SystemSettingsGroupKey) => setSelectedGroupKey(nextValue)}
            variant='scrollable'
            scrollButtons='auto'
            allowScrollButtonsMobile
            sx={{ px: 1, minHeight: 44 }}
          >
            {groups.map(group => (
              <Tab key={group.key} value={group.key} label={group.title} sx={{ minHeight: 44 }} />
            ))}
          </Tabs>
        </Paper>
      )}

      {activeGroup && (
        <Grid container spacing={4}>
          {activeGroup.modules.map(module => (
            <Grid key={module.key} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <SystemSettingCard module={module} onOpen={handleOpenModule} />
            </Grid>
          ))}
        </Grid>
      )}

      {groups.length === 0 && (
        <Paper variant='outlined' sx={{ p: 6, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
            {hubText(dictionary, 'hub_empty_title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {hubText(dictionary, 'hub_empty_description', { total: totalModules })}
          </Typography>
        </Paper>
      )}
    </Stack>
  )
}

export default SystemSettingsHub
