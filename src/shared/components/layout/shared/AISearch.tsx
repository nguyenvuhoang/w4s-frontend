'use client'

import type { Locale } from '@configs/i18n'
import * as Icons from '@mui/icons-material'
import {
    Autocomplete,
    Box,
    InputAdornment,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField
} from '@mui/material'
import type { VerticalMenuDataType } from '@shared/types/menuTypes'
import { getLocalizedUrl } from '@utils/i18n'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { staticSynonyms, commonStopWords } from '@/data/aiSearchData'

interface AISearchProps {
    menuData: VerticalMenuDataType[] | any[]
    dictionary?: any
}

interface FlattenedMenuItem {
    label: string
    path: string
    icon?: string
    keywords: string[]
    parentLabels: string[]
}

const AISearch = ({ menuData, dictionary }: AISearchProps) => {
    const [value, setValue] = useState<FlattenedMenuItem | null>(null)
    const [inputValue, setInputValue] = useState('')
    const router = useRouter()
    const { locale } = useParams()

    // Flatten menu data for easier searching
    const normalizeString = useCallback((str: string) => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .trim()
    }, [])

    // Extract keywords from a string for "learning"
    const extractKeywords = useCallback((str: string): string[] => {
        const normalized = normalizeString(str)
        return normalized
            .split(/\s+/)
            .filter(word => word.length > 1 && !commonStopWords.includes(word))
    }, [normalizeString])

    // Flatten menu data and "learn" keywords
    const flattenedMenu = useMemo(() => {
        const flattened: FlattenedMenuItem[] = []

        const processItem = (item: any, parents: string[] = []) => {
            // Skip sections
            if (item.isSection) {
                if (item.children) item.children.forEach((child: any) => processItem(child, parents))
                return
            }

            // Extract label from various possible properties
            let label = ''
            if (typeof item.label === 'string') label = item.label
            else if (typeof item.command_name_language === 'string') label = item.command_name_language
            else if (typeof item.command_name === 'string') label = item.command_name

            const path = item.href || item.command_uri || item.command_url
            const children = item.children || item.items || item.submenus

            if (label && path) {
                flattened.push({
                    label,
                    path,
                    icon: item.icon || item.group_menu_icon || item.command_icon,
                    keywords: extractKeywords(`${parents.join(' ')} ${label}`),
                    parentLabels: parents
                })
            }

            if (children && Array.isArray(children)) {
                const nextParents = label ? [...parents, label] : parents

                children.forEach((child: any) => processItem(child, nextParents))
            }
        }

        if (Array.isArray(menuData)) {
            menuData.forEach(item => processItem(item))
        }

        // Remove duplicates based on path
        const uniqueMap = new Map()
        flattened.forEach(item => {
            if (!uniqueMap.has(item.path)) {
                uniqueMap.set(item.path, item)
            }
        })

        return Array.from(uniqueMap.values())
    }, [extractKeywords, menuData])

    // Custom filter for "natural language" commands using static synonyms and dynamic keywords
    const filterOptions = (options: FlattenedMenuItem[], { inputValue }: { inputValue: string }) => {
        const normalizedInput = normalizeString(inputValue)

        // Remove stop words from input to get the core intent
        const inputWords = normalizedInput.split(/\s+/).filter(w => !commonStopWords.includes(w))
        const cleanInput = inputWords.join(' ')

        if (!cleanInput) return []

        return options.filter(option => {
            const normalizedLabel = normalizeString(`${option.parentLabels.join(' ')} ${option.label}`)

            // 1. Direct match with label
            if (normalizedLabel.includes(cleanInput)) return true

            // 2. Keyword match (matching learned terms)
            if (inputWords.some(word => option.keywords.includes(word))) return true

            // 3. Synonym match
            for (const [key, list] of Object.entries(staticSynonyms)) {
                // If input matches a synonym group key (e.g. 'phan quyen'), 
                // check if the menu label contains any of its related terms (e.g. 'role')
                if (cleanInput.includes(key) || key.includes(cleanInput)) {
                    if (list.some(syn => normalizedLabel.includes(syn))) return true
                }

                // Vice-versa: if the input is a technical term (e.g. 'role'),
                // check if the label matches the synonym group key (e.g. 'Phân quyền')
                if (list.some(syn => cleanInput.includes(syn) || syn.includes(cleanInput))) {
                    if (normalizedLabel.includes(key)) return true
                }
            }

            return false
        })
    }

    const handleSelect = (event: any, newValue: FlattenedMenuItem | null) => {
        if (newValue) {
            const localizedUrl = getLocalizedUrl(newValue.path, locale as Locale)
            router.push(localizedUrl)
            setValue(null)
            setInputValue('')
        }
    }

    // Handle Enter key for quick navigation when exactly one or best match is found
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !value && inputValue) {
            const filtered = filterOptions(flattenedMenu, { inputValue })
            if (filtered.length > 0) {
                handleSelect(null, filtered[0])
            }
        }
    }

    const common = dictionary?.common ?? {}
    const navigation = dictionary?.navigation ?? {}
    const searchLabel = common.search ?? navigation.search ?? 'Search'
    const noOptionsText = common.no_result ?? common.noResult ?? navigation.no_result ?? searchLabel
    const placeholder = `${searchLabel}...`

    return (
        <Box sx={{ width: { xs: '100%', md: 280 }, mx: { xs: 0, md: 3 } }}>
            <Autocomplete
                value={value}
                onChange={handleSelect}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue)
                }}
                autoHighlight
                clearOnBlur
                options={flattenedMenu}
                getOptionLabel={(option) => option.label}
                filterOptions={filterOptions}
                noOptionsText={noOptionsText}
                onKeyDown={handleKeyDown}
                renderOption={(props, option) => {
                    const { key, ...rest } = props as any
                    const DynamicIcon = option.icon && (Icons as any)[option.icon] ? (Icons as any)[option.icon] : Icons.Search;

                    return (
                        <ListItem key={key} {...rest} sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <DynamicIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={option.label}
                                secondary={option.parentLabels.length > 0 ? option.parentLabels.join(' / ') : undefined}
                                slotProps={{
                                    primary: {
                                        variant: 'body2', fontWeight: 500
                                    },
                                    secondary: {
                                        variant: 'caption'
                                    }
                                }}
                            />
                        </ListItem>
                    )
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        size="small"
                        placeholder={placeholder}
                        variant="outlined"
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Icons.AutoAwesome sx={{ color: 'primary.main', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                                sx: {
                                    minHeight: 38,
                                    borderRadius: '999px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.72)',
                                    color: 'text.primary',
                                    boxShadow: '0 8px 24px rgba(34, 80, 135, 0.08)',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(34, 80, 135, 0.12)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(34, 80, 135, 0.28)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'primary.main',
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'text.disabled',
                                        opacity: 1
                                    },
                                    '& .MuiAutocomplete-endAdornment .MuiIconButton-root': {
                                        color: 'text.secondary'
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    fontSize: '0.875rem'
                                }
                            }
                        }}
                    />
                )}
            />
        </Box>
    )
}

export default AISearch
