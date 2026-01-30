'use client';

import { getDictionary } from '@utils/getDictionary';
import { Alert, Snackbar } from '@mui/material';
import React from 'react';

type Props = {
    toastOpen: boolean;
    toastMessage: string;
    toastSeverity: 'success' | 'error' | 'warning' | 'info';
    handleCloseToast: () => void;
};

const SnackbarComponent = ({ toastOpen, handleCloseToast, toastMessage, toastSeverity }: Props) => {
    return (
        <Snackbar
            open={toastOpen}
            autoHideDuration={3000}
            onClose={handleCloseToast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={handleCloseToast}
                severity={toastSeverity}
                sx={{
                    width: '100%',
                    ...(toastSeverity === 'success' && {
                        backgroundColor: '#09633F', 
                        color: '#ffffff', 
                        '& .MuiAlert-icon': {
                            color: '#ffffff',
                        },
                    }),
                }}
            >
                {toastMessage}
            </Alert>
        </Snackbar>
    );
};

export default SnackbarComponent;

