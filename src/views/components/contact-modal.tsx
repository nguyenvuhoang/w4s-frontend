import { getDictionary } from '@/utils/getDictionary';
import { Box, Divider, IconButton, Modal, Typography } from '@mui/material';
import { useState } from 'react';

const ContactInfoModal = ({ dictionary }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}
) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <div>
            <IconButton onClick={handleOpen}>
                <i className="ri-headphone-line text-[#A1C038] text-xl"></i>
            </IconButton>
            <Modal open={open} onClose={handleClose}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500, // Adjust width as needed
                        bgcolor: 'white', // White background
                        borderRadius: '8px',
                        boxShadow: 24,
                        p: 4,
                        outline: 'none'
                    }}
                >
                    <Typography variant="h4" component="h4" sx={{ mb: 10, textAlign: 'center' }}>
                        {dictionary['common'].contactinformation}
                    </Typography>

                    <Box>
                        <Box className="flex items-center space-x-2 mb-3">
                            <i className="ri-message-line text-[#A1C038] text-2xl"></i>
                            <Box>
                                <Typography variant="body1">{dictionary['common'].chatwithdigibot}</Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} /> {/* Horizontal line */}

                        <Box className="flex items-center space-x-2 mb-3">
                            <i className="ri-phone-line text-[#A1C038] text-2xl"></i>
                            <Box>
                                <Typography variant="body1">{dictionary['common'].hotline} 24/7</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    +856 21 520520
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    www.emimfi.com
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} /> {/* Horizontal line */}

                        <Box className="flex items-center space-x-2">
                            <i className="ri-building-line text-[#A1C038] text-2xl"></i>
                            <Box>
                                <Typography variant="body1">{dictionary['common'].headoffice}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Saphanthong Nuear Village, Sisattanak District, Vientiane Capital,
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default ContactInfoModal;
