'use client'

import { useMemo, useState } from 'react'

import AppsRounded from '@mui/icons-material/AppsRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import StarRounded from '@mui/icons-material/StarRounded'
import { Box, Button, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useParams, useRouter } from 'next/navigation'

import type { Locale } from '@configs/i18n'
import type { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import type { VerticalSubMenuDataType } from '@shared/types/menuTypes'

import ModuleCard from './ModuleCard'
import { flattenMenus, getMenuChildren, getMenuTitle } from '../shared/menu-utils'

type ModuleLauncherProps = {
  moduleItem: VerticalSubMenuDataType
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  onBack: () => void
}

const ModuleLauncher = ({ moduleItem, dictionary, onBack }: ModuleLauncherProps) => {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const router = useRouter()
  const { locale } = useParams()
  const theme = useTheme()

  const common = dictionary.common ?? {}
  const dashboardDict = (dictionary as Record<string, any>).dashboard ?? {}
  const moduleDict = dashboardDict.moduleLauncher ?? {}
  const moduleTitle = getMenuTitle(moduleItem)

  const text = {
    home: common.home ?? 'Home',
    all: common.all ?? 'All',
    favorites: moduleDict.favorites ?? common.favoritefunctions ?? 'Favorites',
    back: common.back ?? 'Back',
    searchModule: moduleDict.searchModulePlaceholder ?? `${common.search ?? 'Search'} ${common.module ?? 'module'}...`,
    noModuleFound: moduleDict.noModuleFound ?? 'No module found',
    availableFunctions: moduleDict.availableFunctions ?? 'available functions',
    moduleFallback: moduleDict.moduleFallback ?? 'Module'
  }

  const children = useMemo(() => getMenuChildren(moduleItem), [moduleItem])
  const searchableChildren = useMemo(() => flattenMenus(children), [children])
  const filteredChildren = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return searchableChildren.filter(item => {
      const matchesKeyword = keyword ? item.searchText.includes(keyword) : true
      const matchesFilter = filter === 'favorites' ? item.favorite : true

      return matchesKeyword && matchesFilter
    })
  }, [filter, query, searchableChildren])

  const groupedChildren = useMemo(() => {
    const fallbackGroup = moduleTitle || text.moduleFallback
    const groups = new Map<string, typeof filteredChildren>()

    filteredChildren.forEach(item => {
      const group = item.category || fallbackGroup
      const items = groups.get(group) ?? []

      items.push(item)
      groups.set(group, items)
    })

    return Array.from(groups.entries()).map(([title, items]) => ({ title, items }))
  }, [filteredChildren, moduleTitle, text.moduleFallback])

  const handleNavigate = (route?: string) => {
    if (!route) return
    router.push(getLocalizedUrl(route, locale as Locale))
  }

  return (
    <Box sx={{ px: { xs: 2.25, md: 3.25 }, py: 3, minHeight: '100%' }}>
      <Box
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.045)} 100%)`,
          boxShadow: `0 8px 28px ${alpha(theme.palette.primary.main, 0.06)}`,
          p: { xs: 2.5, md: 3 }
        }}
      >
        <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2.25} flexWrap='wrap'>
          <Box>
            <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 0.25, letterSpacing: '0.02em' }}>
              {text.home} / {moduleTitle || text.moduleFallback}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#134B2F', lineHeight: 1.3 }}>
              {moduleTitle || text.moduleFallback}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.25 }}>
              {searchableChildren.length} {text.availableFunctions}
            </Typography>
          </Box>

          <Stack direction='row' spacing={1} alignItems='center'>
            <Button
              size='small'
              variant='outlined'
              startIcon={<AppsRounded sx={{ fontSize: 16 }} />}
              onClick={() => setFilter('all')}
              sx={{
                height: 30,
                minWidth: 0,
                fontSize: 12,
                borderRadius: '9px',
                px: 1.35,
                color: '#087A52',
                borderColor: alpha('#087A52', filter === 'all' ? 0.72 : 0.42),
                backgroundColor: alpha('#087A52', filter === 'all' ? 0.09 : 0.04),
                '& .MuiButton-startIcon': { mr: 0.55, color: '#087A52' }
              }}
            >
              {text.all}
            </Button>
            <Button
              size='small'
              variant='outlined'
              startIcon={<StarRounded sx={{ fontSize: 15 }} />}
              onClick={() => setFilter('favorites')}
              sx={{
                height: 30,
                minWidth: 0,
                fontSize: 12,
                borderRadius: '9px',
                px: 1.35,
                color: alpha(theme.palette.text.secondary, 0.92),
                borderColor: alpha(theme.palette.text.secondary, filter === 'favorites' ? 0.42 : 0.2),
                backgroundColor: alpha(theme.palette.background.paper, filter === 'favorites' ? 0.95 : 0.68),
                '& .MuiButton-startIcon': { mr: 0.55, color: '#D79700' }
              }}
            >
              {text.favorites}
            </Button>
            <Button
              size='small'
              variant='outlined'
              startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
              onClick={onBack}
              sx={{
                height: 30,
                minWidth: 0,
                fontSize: 12,
                borderRadius: '9px',
                px: 1.35,
                color: '#0F4A38',
                borderColor: alpha('#0F4A38', 0.35),
                backgroundColor: alpha('#0F4A38', 0.035),
                '& .MuiButton-startIcon': { mr: 0.55, color: '#0F4A38' }
              }}
            >
              {text.back}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5, borderColor: alpha(theme.palette.primary.main, 0.09) }} />

        <TextField
          fullWidth
          placeholder={text.searchModule}
          value={query}
          onChange={event => setQuery(event.target.value)}
          inputProps={{ style: { fontSize: 13, paddingTop: 9, paddingBottom: 9 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchRounded sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.78) }} />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 3.25,
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              height: 42,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
              '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
              '&.Mui-focused fieldset': { borderColor: alpha(theme.palette.primary.main, 0.46), borderWidth: 1 },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.09)}`
              }
            }
          }}
        />

        {groupedChildren.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
            {text.noModuleFound}
          </Box>
        ) : (
          <Stack spacing={3.25}>
            {groupedChildren.map(group => (
              <Box key={group.title}>
                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 1.75 }}>
                  <Typography sx={{ fontWeight: 700, color: '#134B2F', fontSize: 14 }}>{group.title}</Typography>
                  <Divider sx={{ flex: 1, borderColor: alpha(theme.palette.primary.main, 0.12) }} />
                  <Typography
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      fontSize: 11,
                      color: '#087A52',
                      backgroundColor: alpha('#087A52', 0.08)
                    }}
                  >
                    {group.items.length}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      xl: 'repeat(3, minmax(0, 1fr))',
                      xxl: 'repeat(4, minmax(0, 1fr))'
                    },
                    gap: 3.25,
                    alignItems: 'start'
                  }}
                >
                  {group.items.map(item => (
                    <ModuleCard key={item.id} item={item} onClick={() => handleNavigate(item.route)} />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default ModuleLauncher
