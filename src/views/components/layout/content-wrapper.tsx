'use client'

import { getDictionary } from '@/utils/getDictionary'
import { Box, Divider, Typography } from '@mui/material'
import React from 'react'

type Props = {
    title: string
    description: string
    icon: React.ReactNode
    children: React.ReactNode
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    /** Có thể truyền "A;B;C" hoặc ["A","B","C"] */
    dataref?: string | string[]
    issearch?: boolean
}

const ContentWrapper = ({
    title,
    description,
    icon,
    children,
    dataref,
    dictionary,
    issearch
}: Props) => {
    // Chuẩn hoá dataref về mảng
    const dataRefs = React.useMemo<string[]>(() => {
        if (!dataref) return []
        if (Array.isArray(dataref)) {
            return dataref
                .map(v => (v ?? '').toString().trim())
                .filter(Boolean)
        }
        return dataref
            .toString()
            .split(';')               // tách theo dấu ;
            .map(s => s.trim())
            .filter(Boolean)
    }, [dataref])

    return (
        <Box className="mx-auto p-6">
            <Box
                sx={{
                    p: 5,
                    bgcolor: '#fcfcfc',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {icon}
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#225087' }}>
                        {title}
                    </Typography>
                </Box>

                <Typography variant="body1" sx={{ color: '#225087', whiteSpace: 'pre-line' }}>
                    {description}
                </Typography>

                {dataRefs.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {dataRefs.map((ref, idx) => (
                            <Box
                                key={`${ref}-${idx}`}
                                sx={{
                                    display: 'inline-block',
                                    px: 2,
                                    py: 0.5,
                                    bgcolor: '#fff',
                                    borderRadius: '16px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    border: '1px solid #e0e0e0',
                                    transform: 'translateY(-2px)'
                                }}
                            >
                                <Typography variant="body2" sx={{ color: '#225087', fontWeight: 500 }}>
                                    {ref}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                <Box>
                    <Typography
                        variant="caption"
                        sx={{ color: '#666', mt: 1, fontStyle: 'italic', fontFamily: 'QuickSand, sans-serif' }}
                    >
                        {issearch ? dictionary['common'].searchformlabel : dictionary['common'].modifyformlabel}
                    </Typography>
                </Box>

                <Divider sx={{ mt: 2 }} />

                {children}
            </Box>
        </Box>
    )
}

export default ContentWrapper
