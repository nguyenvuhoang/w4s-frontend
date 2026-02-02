'use client'

import { Dispatch, SetStateAction, useState } from 'react';

import { DeviceView } from '@shared/types';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import IosShareIcon from '@mui/icons-material/IosShare';
import LaptopChromebookIcon from '@mui/icons-material/LaptopChromebook';
import MenuIcon from '@mui/icons-material/Menu';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import RedoIcon from '@mui/icons-material/Redo';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import TabletAndroidIcon from '@mui/icons-material/TabletAndroid';
import UndoIcon from '@mui/icons-material/Undo';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Menu, MenuItem } from '@mui/material';
import EditJson from './EditJson';
import { getDictionary } from '@utils/getDictionary';

type Props = {
    selectedView: DeviceView;
    setSelectedView: Dispatch<SetStateAction<DeviceView>>;
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const HeaderArea = ({ selectedView, setSelectedView, dictionary }: Props) => {
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    return (
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>

                {/* Toglle Button */}

                <Box style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                        onClick={handleMenuClick}
                        style={{
                            padding: '8px',
                            margin: '0 8px',
                            border: '1px solid #ddd',
                            background: '#e8f5e9',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '20px',
                            width: '40px',
                            height: '40px',
                        }}
                    >
                        <MenuIcon sx={{ color: '#139556' }} />
                    </button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleMenuClose}><DownloadIcon sx={{ marginRight: '8px', color: '#139556' }} /> Download</MenuItem>
                        <MenuItem onClick={handleMenuClose}><UploadIcon sx={{ marginRight: '8px', color: '#139556' }} /> Upload</MenuItem>
                        <MenuItem onClick={handleMenuClose}><SaveAsIcon sx={{ marginRight: '8px', color: '#139556' }} /> Save as</MenuItem>
                        <MenuItem onClick={handleMenuClose}><SystemUpdateAltIcon sx={{ marginRight: '8px', color: '#139556' }} /> Export forms</MenuItem>
                        <MenuItem onClick={handleMenuClose}><IosShareIcon sx={{ marginRight: '8px', color: '#139556' }} /> Import forms</MenuItem>
                        <MenuItem onClick={handleMenuClose}><ClearIcon sx={{ marginRight: '8px', color: '#139556' }} /> Clear</MenuItem>
                    </Menu>
                </Box>

                <button
                    style={{
                        padding: '8px',
                        margin: '0 8px',
                        border: '1px solid #ddd',
                        background: '#e8f5e9',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '20px',
                        width: '40px',
                        height: '40px',
                    }}
                    title='Save'
                >
                    <SaveAsIcon sx={{ color: '#139556' }} />
                </button>
                <button
                    style={{
                        padding: '8px',
                        margin: '0 8px',
                        border: '1px solid #ddd',
                        background: '#e8f5e9',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '20px',
                        width: '40px',
                        height: '40px',
                    }}
                    title='Undo'
                >
                    <UndoIcon sx={{ color: '#139556' }} />
                </button>
                <button
                    style={{
                        padding: '8px',
                        margin: '0 8px',
                        border: '1px solid #ddd',
                        background: '#e8f5e9',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '20px',
                        width: '40px',
                        height: '40px',
                    }}
                    title='Redo'
                >
                    <RedoIcon sx={{ color: '#139556' }} />
                </button>
            </Box>
            <Box style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    style={{
                        padding: '8px 16px',
                        marginBottom: '10px',
                        backgroundColor: isPreviewMode ? '#215340' : '#139556',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        // Removed hardcoded fontFamily to inherit from theme

                    }}
                >
                    {isPreviewMode ? <><AutoFixHighIcon /> EDIT</> : <><VisibilityIcon /> PREVIEW</>}
                </button>
            </Box>

            <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {[
                    { view: 'desktop', icon: <LaptopChromebookIcon />, tooltip: 'Desktop' },
                    { view: 'tablet', icon: <TabletAndroidIcon />, tooltip: 'Tablet' },
                    { view: 'mobile', icon: <PhoneAndroidIcon />, tooltip: 'Mobile' },
                ].map(({ view, icon, tooltip }) => (
                    <button
                        key={view}
                        onClick={() => setSelectedView(view as DeviceView)}
                        style={{
                            padding: '8px',
                            margin: '0 8px',
                            border: selectedView === view ? '2px solid #139556' : '1px solid #ddd',
                            background: selectedView === view ? '#e8f5e9' : '#fff',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '20px',
                            width: '40px',
                            height: '40px',
                        }}
                        title={tooltip}
                    >
                        {icon}
                    </button>
                ))}

                <EditJson dictionary={dictionary} />
            </Box>
        </Box>
    )
}

export default HeaderArea


