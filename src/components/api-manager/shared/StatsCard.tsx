'use client';

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
    return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                        {label}
                    </Typography>
                    {icon && <Box sx={{ color: 'primary.main' }}>{icon}</Box>}
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
                {trend && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: trend.direction === 'up' ? 'success.main' : 'error.main',
                            display: 'flex',
                            alignItems: 'center',
                            mt: 1
                        }}
                    >
                        {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
