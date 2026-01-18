'use client'

import { Box, Divider, Typography } from '@mui/material'
import React from 'react'

type Props = {
    title: string,
    children: React.ReactNode
}

const SMSHeaderWrapper = ({
    title,
    children,
}: Props) => {
    return (
        <Box className="mx-auto p-6">
            <Box
                sx={{
                    padding: 5,
                    backgroundColor: "#fcfcfc",
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mb: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: "bold", color: "#225087" }}>
                        {title}
                    </Typography>
                </Box>


                <Divider sx={{ mt: 2 }} />

                {children}

            </Box>
        </Box>
    )
}

export default SMSHeaderWrapper
