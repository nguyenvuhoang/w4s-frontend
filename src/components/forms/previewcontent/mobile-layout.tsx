'use client';

import { getDictionary } from '@/utils/getDictionary';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsIcon from '@mui/icons-material/Notifications';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SettingsIcon from '@mui/icons-material/Settings';
import { Badge, Box, Grid, IconButton, Typography } from '@mui/material';
import DynamicPageGenericMobilePreview from './dynamic-page-generic-mobile';

type Props = {
    data: any;
    dictionary: Awaited<ReturnType<typeof getDictionary>>
};

const MobileLayout = ({ data, dictionary }: Props) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#F9F9F9',
            }}
            id="mobile-box"
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '480px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 3,
                    backgroundColor: '#074C31',
                    height: '100%',
                    overflow: 'auto'
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: '#074C31',
                        color: '#fff',
                        padding: '16px'
                    }}
                >
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid>
                            <Typography variant="h5" sx={{ color: 'white' }}>Hi, user</Typography>
                        </Grid>
                        <Grid>
                            <Badge badgeContent={3} color="error">
                                <IconButton sx={{ color: '#fff' }}>
                                    <NotificationsIcon />
                                </IconButton>
                            </Badge>
                        </Grid>
                    </Grid>
                </Box>

                {/* Render Content here */}
                <Box
                    sx={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: '#FDFEFF',
                        borderTop: '1px solid #E0E0E0',
                        borderRadius: '20px 20px 0 0'
                    }}
                >
                    {data && <DynamicPageGenericMobilePreview formlayout={data} language={'en'} dictionary={dictionary} />}
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        position: 'relative',
                        backgroundColor: '#FFFFFF',
                        paddingBottom: '16px',
                    }}
                >
                    {/* Top Gradient Section */}
                    <Box
                        sx={{
                            background: 'linear-gradient(90deg, #DAECD4 0%, #DEF4F2 100%)',
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            borderTop: '1px solid #E0E0E0',
                            borderRadius: '20px 20px 0 0',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {/* Left Icon */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '60px',
                            }}
                        >
                            <InfoIcon sx={{ color: '#0B9150', fontSize: '32px' }} />
                        </Box>

                        {/* Center QR Code Icon */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '-30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#0B9150',
                                color: '#fff',
                                padding: '16px',
                                borderRadius: '50%',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 20,
                            }}
                        >
                            <QrCodeScannerIcon sx={{ fontSize: '36px' }} />
                        </Box>

                        {/* Right Icon */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <NotificationsIcon sx={{ color: '#0B9150', fontSize: '32px' }} />
                        </Box>
                    </Box>

                    {/* Bottom White Section */}
                    <Box
                        sx={{
                            backgroundColor: '#FFFFFF',
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            marginTop: '10px', // To prevent overlap with the QR button
                        }}
                    >
                        {/* Home */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <HomeIcon sx={{ color: '#0B9150', fontSize: '36px' }} />
                            <Typography
                                variant="caption"
                                sx={{ color: '#0B9150', fontFamily: 'Quicksand', marginTop: '4px', fontSize: '14px' }}
                            >
                                Home
                            </Typography>
                        </Box>

                        {/* User Guide */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MenuBookIcon sx={{ color: '#0B9150', fontSize: '36px' }} />
                            <Typography
                                variant="caption"
                                sx={{ color: '#0B9150', fontFamily: 'Quicksand', marginTop: '4px', fontSize: '14px' }}
                            >
                                User guide
                            </Typography>
                        </Box>

                        {/* History */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <HistoryIcon sx={{ color: '#0B9150', fontSize: '36px' }} />
                            <Typography
                                variant="caption"
                                sx={{ color: '#0B9150', fontFamily: 'Quicksand', marginTop: '4px', fontSize: '14px' }}
                            >
                                History
                            </Typography>
                        </Box>

                        {/* Setting */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <SettingsIcon sx={{ color: '#0B9150', fontSize: '36px' }} />
                            <Typography
                                variant="caption"
                                sx={{ color: '#0B9150', fontFamily: 'Quicksand', marginTop: '4px', fontSize: '14px' }}
                            >
                                Setting
                            </Typography>
                        </Box>
                    </Box>
                </Box>



            </Box>
        </Box>
    );
};

export default MobileLayout;
