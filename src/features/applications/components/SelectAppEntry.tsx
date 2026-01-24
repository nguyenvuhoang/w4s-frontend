'use client'

import LoadingSubmit from '@/components/LoadingSubmit'
import { RoleChannel } from '@/types/systemTypes'
import useSelectApp from '@features/applications/hooks/useSelectApp'
import * as MuiIcons from '@mui/icons-material'
import { Box, Card, CardContent, Typography } from '@mui/material'
import React from 'react'

type Props = {
    ch: RoleChannel
}

const SelectAppEntry = ({ ch }: Props) => {

    const { handleSelect, loading, selectedId } = useSelectApp()
    const iconSrc = (ch as any).app_icon || (ch as any).appIcon || (ch as any).icon || ''

    let IconComponent: React.ElementType | null = null
    if (
        iconSrc &&
        typeof iconSrc === 'string' &&
        (MuiIcons as Record<string, React.ElementType>)[iconSrc]
    ) {
        IconComponent = (MuiIcons as Record<string, React.ElementType>)[iconSrc]
    }
    const isImage = iconSrc && (iconSrc.startsWith('http') || iconSrc.startsWith('/'))

    // Style for card (default MUI light)
    const cardBg = 'background.paper'
    const borderColor = 'divider'
    const iconColor = 'text.secondary'
    const titleColor = 'text.primary'
    const descColor = 'text.secondary'

    return (
        <Card
            sx={{
                position: 'relative',
                cursor: 'pointer',
                width: { xs: 240, sm: 240, md: 240 },
                height: { xs: 220, sm: 220, md: 220 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0,
                boxShadow: 3,
                borderRadius: 4,
                border: `2px solid ${borderColor}`,
                background: cardBg,
                transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                '&:hover': {
                    boxShadow: 8,
                    borderColor: '#ffa726',
                    transform: 'translateY(-4px) scale(1.03)',
                },
            }}
            onClick={() => {
                handleSelect(ch);
            }}
        >
            {loading && selectedId === ch.channel_id && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    background: 'rgba(255,255,255,0.7)'
                }}>
                    <LoadingSubmit loadingtext={`Load Application ${ch.channel_name}`} />
                </Box>
            )}
            <CardContent sx={{ flex: 1, p: 3, width: '100%', height: '100%' }}>
                <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 1 }}>
                    {/* Icon rendering logic */}
                    {IconComponent ? (
                        <IconComponent sx={{ fontSize: 48, color: iconColor, mb: 1 }} />
                    ) : isImage ? (
                        <Box component="img" src={iconSrc} alt={ch.channel_name} sx={{ width: 48, height: 48, objectFit: 'contain', mb: 1, borderRadius: '50%', border: `2px solid ${borderColor}`, bgcolor: 'background.paper' }} />
                    ) : (
                        <Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, borderRadius: '50%', border: `2px solid ${borderColor}`, bgcolor: 'background.paper', fontSize: 28, color: iconColor }}>
                            {ch.channel_id?.[0]}
                        </Box>
                    )}
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 600, color: titleColor }}>{ch.channel_name}</Typography>
                    <Typography variant="body2" sx={{ color: descColor, mt: 1 }}>
                        {ch.description}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    )
}

export default SelectAppEntry
