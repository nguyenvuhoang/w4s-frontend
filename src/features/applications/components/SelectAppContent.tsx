

import { RoleChannel } from '@/types/systemTypes'
import SelectAppEntry from '@features/applications/components/SelectAppEntry'
import { Box, Grid } from '@mui/material'

type Props = {
    channelData: RoleChannel[]
}

const SelectAppContent = ({ channelData }: Props) => {
    return (
        <Box sx={{
            py: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            position: 'relative',
            background: `linear-gradient(120deg, #f8fafc 0%, #f1f5f9 60%, #e0e7ef 100%),
                radial-gradient(ellipse 60% 40% at 30% 20%, #ffe0b2 0%, #f8fafc00 100%),
                radial-gradient(ellipse 40% 30% at 80% 80%, #b3e5fc 0%, #f8fafc00 100%)`,
            overflow: 'hidden',
        }}>
            <Box sx={{ width: '100%', maxWidth: 1100, px: 2, position: 'relative', zIndex: 1 }}>
                <Grid container spacing={3} justifyContent="center" alignItems="center">
                    {channelData.map((ch) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={ch.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                                <SelectAppEntry ch={ch} />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    )
}

export default SelectAppContent
