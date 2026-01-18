'use client';

import { PageContentProps } from '@/types';
import {
    Card,
    CardContent,
    Typography,
    Box,
    alpha,
    Chip,
    Grid,
    Paper,
    LinearProgress,
} from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import * as Icons from '@mui/icons-material';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as FaIcons from "@fortawesome/free-solid-svg-icons";
import React from 'react';

interface Budget {
    id: number;
    budget_id: string;
    wallet_id: string;
    category_id: string;
    amount: number;
    source_budget: string;
    souce_tracker: string | null;
    period_type: string;
    start_date: string;
    end_date: string;
}

interface Category {
    category_id: string;
    category_name: string;
    icon: string;
    color: string;
}

interface WalletBudgetTabProps {
    walletData: any;
    dictionary: PageContentProps['dictionary'];
    session: PageContentProps['session'];
    locale: PageContentProps['locale'];
}

const WalletBudgetTab = ({
    walletData,
    dictionary,
    session,
    locale,
}: WalletBudgetTabProps) => {
    // Get budgets and categories from first wallet
    const wallet = walletData?.wallets?.[0] || {};
    const budgets: Budget[] = wallet?.budgets || [];
    const categories: Category[] = wallet?.categories || [];

    // Create category lookup map
    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.category_id] = cat;
        return acc;
    }, {} as Record<string, Category>);

    // Format currency
    const formatCurrency = (value: number, currency: string = 'VND') => {
        return new Intl.NumberFormat('vi-VN').format(value || 0) + ' ' + currency;
    };

    // Format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
            day: '2-digit',
            month: 'short',
        });
    };

    // Get period label
    const getPeriodLabel = (period: string) => {
        const periods: Record<string, Record<string, string>> = {
            'MONTH': { vi: 'Tháng', en: 'Monthly' },
            'WEEK': { vi: 'Tuần', en: 'Weekly' },
            'YEAR': { vi: 'Năm', en: 'Yearly' },
            'DAY': { vi: 'Ngày', en: 'Daily' },
        };
        return periods[period]?.[locale] || periods[period]?.['en'] || period;
    };

    // Parse category name
    const getCategoryName = (categoryName: string): string => {
        try {
            const parsed = JSON.parse(categoryName);
            return parsed[locale] || parsed['en'] || parsed['vi'] || categoryName;
        } catch {
            return categoryName;
        }
    };

    // Render dynamic icon
    const renderIcon = (iconName: string, color: string, size: number = 20) => {
        const iconKey = String(iconName ?? '');

        // Try MUI icon first
        const MuiIcon =
            (Icons as any)[iconKey] ||
            (Icons as any)[iconKey.charAt(0).toUpperCase() + iconKey.slice(1)];

        if (MuiIcon) {
            return React.createElement(MuiIcon, {
                style: { fontSize: size, color: color }
            });
        }

        // Try FontAwesome icon
        if (iconKey.startsWith('fa-')) {
            const faName =
                'fa' +
                iconKey
                    .replace('fa-', '')
                    .split('-')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join('');

            const FaIcon = (FaIcons as any)[faName];

            if (FaIcon) {
                return (
                    <FontAwesomeIcon
                        icon={FaIcon}
                        style={{
                            fontSize: size,
                            color: color
                        }}
                    />
                );
            }
        }

        // Fallback
        return <SavingsIcon style={{ fontSize: size, color: color }} />;
    };

    // Calculate total budget
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const activeBudgets = budgets.filter(b => b.amount > 0);

    return (
        <Card className="shadow-md" sx={{ borderRadius: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#225087', fontWeight: 600 }}>
                        {dictionary['wallet']?.budgetInfo || 'Budget Information'}
                    </Typography>
                    {budgets.length > 0 && (
                        <Chip
                            label={`${activeBudgets.length}/${budgets.length} ${dictionary['wallet']?.active || 'Active'}`}
                            color="primary"
                            size="small"
                        />
                    )}
                </Box>

                {budgets.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 8,
                            px: 4,
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: alpha('#225087', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}
                        >
                            <SavingsIcon sx={{ fontSize: 40, color: '#225087' }} />
                        </Box>
                        <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                            {dictionary['wallet']?.noBudgets || 'No Budgets Set'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
                            {dictionary['wallet']?.noBudgetsDescription ||
                                'You haven\'t set up any budgets for this wallet yet. Create budgets to track and manage your spending limits.'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Summary Card */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #225087 0%, #1780AC 100%)',
                                color: 'white',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <SavingsIcon sx={{ fontSize: 32 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                                        {dictionary['wallet']?.totalBudget || 'Total Monthly Budget'}
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                                        {formatCurrency(totalBudget)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7, color: 'white' }}>
                                        {dictionary['wallet']?.categories || 'Categories'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                                        {budgets.length}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7, color: 'white' }}>
                                        {dictionary['wallet']?.withBudget || 'With Budget'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                                        {activeBudgets.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Budget List */}
                        <Grid container spacing={2}>
                            {budgets.map((budget) => {
                                const category = categoryMap[budget.category_id];
                                const categoryName = category ? getCategoryName(category.category_name) : budget.category_id;
                                const categoryColor = category?.color || '#9e9e9e';
                                const categoryIcon = category?.icon || 'Category';

                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={budget.id}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: budget.amount > 0 ? alpha(categoryColor, 0.3) : '#e0e0e0',
                                                bgcolor: budget.amount > 0 ? alpha(categoryColor, 0.03) : '#fafafa',
                                                opacity: budget.amount > 0 ? 1 : 0.7,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    borderColor: categoryColor,
                                                    boxShadow: `0 4px 12px ${alpha(categoryColor, 0.15)}`,
                                                },
                                            }}
                                        >
                                            {/* Header */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha(categoryColor, 0.15),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {renderIcon(categoryIcon, categoryColor, 20)}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#1a1a1a',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {categoryName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CalendarTodayIcon sx={{ fontSize: 12, color: '#999' }} />
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            {getPeriodLabel(budget.period_type)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* Amount */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: budget.amount > 0 ? categoryColor : '#999',
                                                    mb: 1,
                                                }}
                                            >
                                                {budget.amount > 0 ? formatCurrency(budget.amount) : (dictionary['wallet']?.noBudgetSet || 'No budget set')}
                                            </Typography>

                                            {/* Progress bar placeholder - would need spent amount */}
                                            {budget.amount > 0 && (
                                                <Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={0} // Would be (spent / amount) * 100
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            bgcolor: alpha(categoryColor, 0.1),
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: categoryColor,
                                                                borderRadius: 3,
                                                            },
                                                        }}
                                                    />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            {formatDate(budget.start_date)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            {formatDate(budget.end_date)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default WalletBudgetTab;
