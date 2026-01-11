'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    IconButton,
    TextField,
    Grid,
    Paper,
    Typography,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Divider,
    CircularProgress
} from '@mui/material'
import * as MuiIcons from '@mui/icons-material'

type IconStyle = 'Filled' | 'Outlined' | 'Rounded' | 'TwoTone' | 'Sharp'

type IconPickerProps = {
    open: boolean
    onClose: () => void
    onSelectIcon: (iconValue: string) => void
    dictionary?: {
        select_icon?: string
        search?: string
        no_results?: string
        filter_style?: string
    }
}

export const IconPicker = ({ open, onClose, onSelectIcon, dictionary = {} }: IconPickerProps) => {
    const [iconSearchQuery, setIconSearchQuery] = useState('')
    const [selectedStyle, setSelectedStyle] = useState<IconStyle>('Filled')
    const [displayedCount, setDisplayedCount] = useState(50) // Hiển thị 50 icons đầu tiên
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const LOAD_MORE_COUNT = 50 // Load thêm 50 icons mỗi lần

    // Tự động tạo danh sách icons từ MUI Icons library
    const availableIcons = useMemo(() => {
        const allIcons = Object.keys(MuiIcons)
            .filter(key => {
                return typeof MuiIcons[key as keyof typeof MuiIcons] === 'object'
            })
            .map(iconName => {
                const IconComponent = MuiIcons[iconName as keyof typeof MuiIcons] as React.ComponentType<any>
                
                // Xác định style của icon
                let style: IconStyle = 'Filled'
                let baseName = iconName
                
                if (iconName.endsWith('Outlined')) {
                    style = 'Outlined'
                    baseName = iconName.replace(/Outlined$/, '')
                } else if (iconName.endsWith('Rounded')) {
                    style = 'Rounded'
                    baseName = iconName.replace(/Rounded$/, '')
                } else if (iconName.endsWith('TwoTone')) {
                    style = 'TwoTone'
                    baseName = iconName.replace(/TwoTone$/, '')
                } else if (iconName.endsWith('Sharp')) {
                    style = 'Sharp'
                    baseName = iconName.replace(/Sharp$/, '')
                }
                
                return {
                    name: baseName,
                    fullName: iconName,
                    component: IconComponent,
                    value: iconName,
                    style: style
                }
            })

        return allIcons
    }, [])

    const filteredIcons = useMemo(() => {
        return availableIcons.filter(icon => {
            const matchesSearch = icon.name.toLowerCase().includes(iconSearchQuery.toLowerCase())
            const matchesStyle = icon.style === selectedStyle
            return matchesSearch && matchesStyle
        })
    }, [availableIcons, iconSearchQuery, selectedStyle])

    // Chỉ render số lượng icons theo displayedCount
    const displayedIcons = useMemo(() => {
        return filteredIcons.slice(0, displayedCount)
    }, [filteredIcons, displayedCount])

    // Handle scroll để load more icons
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget
        const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight
        
        // Khi scroll đến 80% thì load thêm
        if (scrollPercentage > 0.8 && displayedCount < filteredIcons.length) {
            setDisplayedCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredIcons.length))
        }
    }, [displayedCount, filteredIcons.length, LOAD_MORE_COUNT])

    // Reset displayedCount khi search hoặc đổi style
    const handleSearchChange = useCallback((value: string) => {
        setIconSearchQuery(value)
        setDisplayedCount(50)
    }, [])

    const handleStyleChange = useCallback((style: IconStyle) => {
        setSelectedStyle(style)
        setDisplayedCount(50)
    }, [])

    const handleSelectIcon = (iconValue: string) => {
        onSelectIcon(iconValue)
        setIconSearchQuery('')
        onClose()
    }

    const handleClose = () => {
        setIconSearchQuery('')
        setDisplayedCount(50)
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {dictionary.select_icon || 'Select Icon'}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <MuiIcons.Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Box display="flex" gap={3}>
                    {/* Filter Sidebar */}
                    <Box sx={{ minWidth: 200, flexShrink: 0 }}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                                {dictionary.filter_style || 'Filter the style'}
                            </FormLabel>
                            <RadioGroup
                                value={selectedStyle}
                                onChange={(e) => handleStyleChange(e.target.value as IconStyle)}
                            >
                                <FormControlLabel
                                    value="Filled"
                                    control={<Radio />}
                                    label="Filled"
                                />
                                <FormControlLabel
                                    value="Outlined"
                                    control={<Radio />}
                                    label="Outlined"
                                />
                                <FormControlLabel
                                    value="Rounded"
                                    control={<Radio />}
                                    label="Rounded"
                                />
                                <FormControlLabel
                                    value="TwoTone"
                                    control={<Radio />}
                                    label="Two tone"
                                />
                                <FormControlLabel
                                    value="Sharp"
                                    control={<Radio />}
                                    label="Sharp"
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>

                    <Divider orientation="vertical" flexItem />

                    {/* Icons Grid */}
                    <Box sx={{ flex: 1 }}>
                        <TextField
                            fullWidth
                            placeholder={dictionary.search || 'Search icons...'}
                            value={iconSearchQuery}
                            onChange={e => handleSearchChange(e.target.value)}
                            sx={{ mb: 2 }}
                            slotProps={{
                                input: {
                                    startAdornment: <MuiIcons.Search sx={{ mr: 1, color: 'text.secondary' }} />
                                }
                            }}
                        />

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {filteredIcons.length.toLocaleString()} matching results
                            {displayedCount < filteredIcons.length && ` (showing ${displayedCount})`}
                        </Typography>

                        <Box 
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            sx={{ maxHeight: '60vh', overflowY: 'auto' }}
                        >
                            <Grid container spacing={1}>
                                {displayedIcons.map(icon => {
                                    const IconComponent = icon.component
                                    return (
                                        <Grid key={icon.value} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    bgcolor: 'background.paper',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                        borderColor: 'primary.main'
                                                    }
                                                }}
                                                onClick={() => handleSelectIcon(icon.value)}
                                            >
                                                <IconComponent sx={{ fontSize: 32, color: 'text.primary', mb: 0.5 }} />
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        lineHeight: 1.2,
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {icon.name}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    )
                                })}
                            </Grid>

                            {/* Loading indicator khi còn icons để load */}
                            {displayedCount < filteredIcons.length && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                        </Box>

                        {filteredIcons.length === 0 && (
                            <Box textAlign="center" py={8}>
                                <Typography color="text.secondary">
                                    {dictionary.no_results || 'No icons found'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    )
}
