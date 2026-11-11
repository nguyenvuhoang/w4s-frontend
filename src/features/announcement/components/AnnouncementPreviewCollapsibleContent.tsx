'use client'

import { memo, useLayoutEffect, useRef, useState } from 'react'
import { Box, Button } from '@mui/material'

import type { AnnouncementDictionary } from '../types'
import { announcementText } from './announcementListHelpers'

type Props = {
    html: string
    collapsedHeight: number
    expandedMaxHeight: number
    lineHeight?: number
    fadeColor?: string
    dictionary?: AnnouncementDictionary
}

const richTextSx = {
    fontSize: 14,
    '& p': { my: 1 },
    '& ul, & ol': { pl: 3, my: 1 },
    '& li': { mb: 0.5 },
    '& a': { color: 'primary.main', textDecoration: 'underline' },
    '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 1 },
    '& table': {
        width: '100%',
        borderCollapse: 'collapse',
        my: 1,
        fontSize: 'inherit'
    },
    '& th, & td': {
        border: '1px solid',
        borderColor: 'divider',
        px: 1,
        py: 0.75,
        verticalAlign: 'top'
    },
    '& figure.table': {
        m: 0,
        overflowX: 'auto'
    }
} as const

const AnnouncementPreviewCollapsibleContent = memo(function AnnouncementPreviewCollapsibleContent({
    html,
    collapsedHeight,
    expandedMaxHeight,
    lineHeight = 1.65,
    fadeColor = '#ffffff',
    dictionary
}: Props) {
    const contentRef = useRef<HTMLDivElement | null>(null)
    const [expanded, setExpanded] = useState(false)
    const [canExpand, setCanExpand] = useState(false)

    useLayoutEffect(() => {
        setExpanded(false)

        const node = contentRef.current

        setCanExpand(Boolean(node) && node!.scrollHeight > collapsedHeight + 1)
    }, [html, collapsedHeight])

    return (
        <Box>
            <Box sx={{ position: 'relative' }}>
                <Box
                    ref={contentRef}
                    sx={{
                        ...richTextSx,
                        color: 'text.primary',
                        lineHeight,
                        maxHeight: expanded ? expandedMaxHeight : collapsedHeight,
                        overflowY: expanded ? 'auto' : 'hidden',
                        transition: 'max-height 160ms ease'
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                {!expanded && canExpand && (
                    <Box
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 36,
                            pointerEvents: 'none',
                            background: `linear-gradient(rgba(255,255,255,0), ${fadeColor})`
                        }}
                    />
                )}
            </Box>
            {canExpand && (
                <Button
                    size="small"
                    onClick={() => setExpanded(current => !current)}
                    sx={{ mt: 0.5, px: 0, minWidth: 0, textTransform: 'none' }}
                >
                    {expanded
                        ? (dictionary ? announcementText(dictionary, 'show_less', 'Show less') : 'Show less')
                        : (dictionary ? announcementText(dictionary, 'show_more', 'Show more') : 'Show more')}
                </Button>
            )}
        </Box>
    )
})

export default AnnouncementPreviewCollapsibleContent
