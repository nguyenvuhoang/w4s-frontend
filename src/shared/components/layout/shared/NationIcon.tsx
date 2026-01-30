'use client'

import { Box, Typography } from '@mui/material';
import Flag from 'react-flagkit';
import PublicIcon from '@mui/icons-material/Public';
import { getDictionary } from '@utils/getDictionary';
import { NationCode } from '@shared/types/bankType';

export const NationIcon = ({ nation, dictionary }: { nation: string | undefined; dictionary: Awaited<ReturnType<typeof getDictionary>> }) => {
    if (!nation) {
        return null;
    }

    const nationCode = nation.trim().toUpperCase() as NationCode;

    const nationName = dictionary['nation']?.[nationCode] || nationCode;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {typeof window !== 'undefined' ? (
                <Flag country={nationCode} size={20} style={{ marginRight: 8 }} />
            ) : (
                <PublicIcon sx={{ color: '#4caf50', mr: 1 }} />
            )}
            <Typography variant="body2" sx={{ color: '#4caf50' }}>
                {nationName}
            </Typography>
        </Box>
    );
};

