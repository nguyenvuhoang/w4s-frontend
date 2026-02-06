'use client';

import React, { ReactNode } from 'react';
import { Box, Typography, Breadcrumbs as MuiBreadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageHeaderProps {
    title: ReactNode;
    action?: ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function PageHeader({ title, action, breadcrumbs }: PageHeaderProps) {
    return (
        <Box sx={{ mb: 4 }}>
            {breadcrumbs && (
                <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 1, fontSize: '0.875rem' }}>
                    {breadcrumbs.map((item, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return isLast ? (
                            <Typography key={index} color="text.primary">{item.label}</Typography>
                        ) : (
                            <MuiLink key={index} component={Link} href={item.href || '#'} underline="hover" color="inherit">
                                {item.label}
                            </MuiLink>
                        );
                    })}
                </MuiBreadcrumbs>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
                <Box>{action}</Box>
            </Box>
        </Box>
    );
}
