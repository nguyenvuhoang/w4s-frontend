'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Chip,
  Box,
} from '@mui/material';

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
  const categories = walletData?.categories || [];

  const labelStyle = {
    color: '#666666',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    mb: 0.5,
  };

  const valueStyle = {
    fontWeight: 600,
    color: '#1a1a1a',
    fontSize: '1rem',
  };

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.categoryInfo || 'Category Information'}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.categoryCode || 'Category Code'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.categoryCode || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.categoryName || 'Category Name'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.categoryName || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.categoryType || 'Category Type'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.categoryType || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.categoryLevel || 'Category Level'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.categoryLevel || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.categoryDescription || 'Description'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.categoryDescription || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.categoryStatus || 'Status'}
            </Typography>
            <Chip
              label={walletData?.categoryStatus || 'Active'}
              color={walletData?.categoryStatus === 'Active' ? 'success' : 'default'}
              size="small"
            />
          </Grid>
        </Grid>

        {/* Sub-categories if available */}
        {categories.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {dictionary['wallet']?.subCategories || 'Sub Categories'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((cat: any, index: number) => (
                <Chip
                  key={index}
                  label={cat.name || cat}
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletCategoryTab;
