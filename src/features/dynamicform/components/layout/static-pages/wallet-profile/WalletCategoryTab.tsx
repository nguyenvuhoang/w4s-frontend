'use client';

import { PageContentProps } from '@/types';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Paper,
    Typography,
    alpha,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as FaIcons from "@fortawesome/free-solid-svg-icons";
import React from 'react';

interface Category {
  category_id: string;
  wallet_id: string;
  parent_category_id: string;
  category_group: string;
  category_type: string;
  category_name: string;
  icon: string;
  web_icon: string;
  color: string;
}

interface WalletCategoryTabProps {
  walletData: any;
  dictionary: PageContentProps['dictionary'];
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
}

const WalletCategoryTab = ({
  walletData,
  dictionary,
  session,
  locale,
}: WalletCategoryTabProps) => {
  // Get categories from first wallet
  const wallet = walletData?.wallets?.[0] || {};
  const categories: Category[] = wallet?.categories || [];

  // Group categories by category_group
  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.category_group || 'OTHER';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  // Helper to parse category name (JSON with vi/en)
  const getCategoryName = (categoryName: string): string => {
    try {
      const parsed = JSON.parse(categoryName);
      return parsed[locale] || parsed['en'] || parsed['vi'] || categoryName;
    } catch {
      return categoryName;
    }
  };

  // Get group label
  const getGroupLabel = (group: string): string => {
    const labels: Record<string, Record<string, string>> = {
      EXPENSE: { vi: 'Chi tiêu', en: 'Expense' },
      INCOME: { vi: 'Thu nhập', en: 'Income' },
      LOAN: { vi: 'Vay/Cho vay', en: 'Loan' },
      OTHER: { vi: 'Khác', en: 'Other' },
    };
    return labels[group]?.[locale] || labels[group]?.['en'] || group;
  };

  // Get group color
  const getGroupColor = (group: string): string => {
    const colors: Record<string, string> = {
      EXPENSE: '#f44336',
      INCOME: '#4caf50',
      LOAN: '#2196f3',
      OTHER: '#9e9e9e',
    };
    return colors[group] || '#9e9e9e';
  };

  // Render dynamic icon (handle both MUI icons and FontAwesome)
  const renderIcon = (iconName: string, color: string, size: number = 20, key?: string) => {
    const iconKey = String(iconName ?? '');

    // Try MUI icon first
    const MuiIcon =
      (Icons as any)[iconKey] ||
      (Icons as any)[iconKey.charAt(0).toUpperCase() + iconKey.slice(1)];

    if (MuiIcon) {
      return <MuiIcon key={key} style={{ fontSize: size, color: color }} />;
    }

    // Try FontAwesome icon
    if (iconKey.startsWith('fa')) {
      const faName = iconKey
      const FaIcon = (FaIcons as any)[faName];

      if (FaIcon) {
        return (
          <FontAwesomeIcon
            key={key}
            icon={FaIcon}
            style={{
              fontSize: size,
              color: color
            }}
          />
        );
      }
    }

    // Fallback - colored circle
    return (
      <Box
        key={key}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          bgcolor: color,
          opacity: 0.8,
        }}
      />
    );
  };

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#225087', fontWeight: 600 }}>
            {dictionary['wallet']?.categoryInfo || 'Wallet Categories'}
          </Typography>
          <Chip
            label={`${categories.length} ${dictionary['wallet']?.categories || 'Categories'}`}
            color="primary"
            size="small"
          />
        </Box>

        {Object.entries(groupedCategories).map(([group, cats]) => (
          <Box key={group} sx={{ mb: 4 }}>
            {/* Group Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  bgcolor: getGroupColor(group),
                  borderRadius: 1,
                }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: getGroupColor(group) }}>
                {getGroupLabel(group)}
              </Typography>
              <Chip label={cats.length} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
            </Box>

            {/* Category Grid */}
            <Grid container spacing={2}>
              {cats.map((cat) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={cat.category_id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: alpha(cat.color || '#9e9e9e', 0.3),
                      bgcolor: alpha(cat.color || '#9e9e9e', 0.05),
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: cat.color,
                        bgcolor: alpha(cat.color || '#9e9e9e', 0.1),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: alpha(cat.color || '#9e9e9e', 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderIcon(cat.web_icon, cat.color, 20, `icon-${cat.category_id}`)}
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
                          {getCategoryName(cat.category_name)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            fontFamily: 'monospace',
                            fontSize: '0.65rem',
                          }}
                        >
                          {cat.category_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {categories.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography variant="body1">
              {dictionary['wallet']?.noCategories || 'No categories found'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletCategoryTab;
