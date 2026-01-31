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
import { useMemo, useState } from 'react'

import { staticSynonyms, commonStopWords } from '@/data/aiSearchData'

interface AISearchProps {
    menuData: VerticalMenuDataType[] | any[]
}

interface FlattenedMenuItem {
    label: string
    path: string
    icon?: string
    keywords: string[] // Dynamic learning: store extracted keywords
}

const AISearch = ({ menuData }: AISearchProps) => {
    const [value, setValue] = useState<FlattenedMenuItem | null>(null)
    const [inputValue, setInputValue] = useState('')
    const router = useRouter()
    const { locale } = useParams()

    // Flatten menu data for easier searching
    const normalizeString = (str: string) => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .trim()
    }

    // Extract keywords from a string for "learning"
    const extractKeywords = (str: string): string[] => {
        const normalized = normalizeString(str)
        return normalized
            .split(/\s+/)
            .filter(word => word.length > 1 && !commonStopWords.includes(word))
    }

    // Flatten menu data and "learn" keywords
    const flattenedMenu = useMemo(() => {
        const flattened: FlattenedMenuItem[] = []

        const processItem = (item: any) => {
            // Skip sections
            if (item.isSection) {
                if (item.children) item.children.forEach(processItem)
                return
            }

            // Handle items with children (SubMenus)
            const children = item.children || item.items || item.submenus
            if (children && Array.isArray(children)) {
                children.forEach(processItem)
            }

            // Extract label from various possible properties
            let label = ''
            if (typeof item.label === 'string') label = item.label
            else if (typeof item.command_name_language === 'string') label = item.command_name_language
            else if (typeof item.command_name === 'string') label = item.command_name

            const path = item.href || item.command_uri || item.command_url

            if (label && path) {
                flattened.push({
                    label,
                    path,
                    icon: item.icon || item.group_menu_icon || item.command_icon,
                    keywords: extractKeywords(label)
                })
            }
        }

        if (Array.isArray(menuData)) {
            menuData.forEach(processItem)
        }

        // Remove duplicates based on path
        const uniqueMap = new Map()
        flattened.forEach(item => {
            if (!uniqueMap.has(item.path)) {
                uniqueMap.set(item.path, item)
            }
        })

        return Array.from(uniqueMap.values())
    }, [menuData])

    // Custom filter for "natural language" commands using static synonyms and dynamic keywords
    const filterOptions = (options: FlattenedMenuItem[], { inputValue }: { inputValue: string }) => {
        const normalizedInput = normalizeString(inputValue)

        // Remove stop words from input to get the core intent
        const inputWords = normalizedInput.split(/\s+/).filter(w => !commonStopWords.includes(w))
        const cleanInput = inputWords.join(' ')

        if (!cleanInput) return []

        return options.filter(option => {
            const normalizedLabel = normalizeString(option.label)

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

    return (
        <Box sx={{ width: { xs: '100%', md: 300 }, mx: 4 }}>
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
                noOptionsText="Không tìm thấy menu nào"
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
                                slotProps={{
                                    primary: {
                                        variant: 'body2', fontWeight: 500
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
                        placeholder="AI Search: Phân quyền, User..."
                        variant="outlined"
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Icons.AutoAwesome sx={{ color: 'white', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: '50px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'white',
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        opacity: 1
                                    },
                                    '& .MuiAutocomplete-endAdornment .MuiIconButton-root': {
                                        color: 'rgba(255, 255, 255, 0.7)'
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
