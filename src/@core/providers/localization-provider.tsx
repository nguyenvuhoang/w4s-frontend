'use client'

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dynamic from 'next/dynamic';
import React from 'react';

const LocalizationProvider = dynamic(() =>
    import('@mui/x-date-pickers/LocalizationProvider').then((mod) => mod.LocalizationProvider),
    { ssr: false }
);


type Props = {
    children: React.ReactNode
}

const LocalizationProviders = ({ children }: Props) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
            {children}
        </LocalizationProvider>
    )
}

export default LocalizationProviders
