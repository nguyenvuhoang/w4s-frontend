'use client'

import { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { getDictionary } from '@utils/getDictionary'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { Box, Typography } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useState } from 'react'

type Props = {
    reportcode: string
    session: Session | null
    locale: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
}

const RenderReportDetail = ({ reportcode, session, dictionary, locale }: Props) => {
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

    let urlRequest = `${env.NEXT_PUBLIC_REPORT_URI}?report_code=${reportcode}&token=${session?.user?.token}&lang=${locale}`;

    useEffect(() => {
        const checkReportAccess = async (url: string) => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Allow-Control-Allow-Origin': '*',
                    },
                });

                if (response.status === 401) {
                    setIsValidSession(false);
                } else {
                    setIsValidSession(true);
                }
            } catch (error) {
                console.error('Error checking report access:', error);
                setIsValidSession(false);
            }
        };

        checkReportAccess(urlRequest);
    }, [urlRequest]);

    return (
        <Box sx={{ width: "100%", height: "100vh", textAlign: "center" }}>
            {isValidSession === null ? (
                <Typography variant="h6">{dictionary['common'].contentdownload}...</Typography>
            ) : isValidSession ? (
                <iframe
                    src={urlRequest ?? ''}
                    width="100%"
                    height="1000px"
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}

                />
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center',
                    }}
                >
                    <ErrorOutlineIcon sx={{ fontSize: 80, color: '#d32f2f', marginBottom: 2 }} />

                    <Typography variant="h4" fontWeight="bold" color="#d32f2f">
                        {dictionary['common'].invalidsession}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '400px', marginTop: 1 }}>
                        {dictionary['common'].sessionexpired}
                    </Typography>
                </Box>
            )}
        </Box>
    )
}

export default RenderReportDetail;

