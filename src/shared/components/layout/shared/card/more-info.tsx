'use client'

import { StyledTextField } from "@/@core/components/custom-inputs/StyledTextField";
import { ErrorType } from "@/@core/types";
import ButtonColor from "@components/forms/button-color";
import ButtonGradient from "@components/forms/button-gradient";
import { getDictionary } from "@utils/getDictionary";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment } from "@mui/material";
import Image from "next/image";
import { SetStateAction, useEffect, useState } from "react";

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    openModal: boolean;
    handleCloseModal: () => void;
}

const CardShowMoreInfo = ({
    dictionary,
    openModal,
    handleCloseModal
}: Props) => {

    const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
    const [captchaImage, setCaptchaImage] = useState<string | null>(null);
    const [captchaId, setCaptchaId] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState('');
    const [openSuccessModal, setOpenSuccessModal] = useState<boolean>(false);
    const [errorState, setErrorState] = useState<ErrorType | null>(null);

    // Fetch the captcha on component mount or when an error occurs
    const fetchCaptcha = async () => {
        const response = await fetch('/api/generate-verify-captcha', { method: 'GET' });
        const data = await response.json();
        setCaptchaId(data.captchaId);
        setCaptchaImage(data.captchaImage);
    }

    useEffect(() => {
        fetchCaptcha();
    }, [captchaError, errorState]);

    // Handle captcha verification
    const handleVerifyCaptcha = async () => {
        try {
            if (!captchaAnswer) {
                setCaptchaError(dictionary['auth'].captcharequired);
            } else {
                setCaptchaError('');  // Clear existing errors before making a new request
                if (captchaId) {
                    try {
                        const response = await fetch('/api/generate-verify-captcha', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ captchaId, captchaAnswer })
                        })

                        const result = await response.json()
                        if (result.success) {
                            setOpenSuccessModal(true);
                            setErrorState(null);  // Clear errors on success

                        } else {
                            setErrorState({ message: [`${dictionary['auth'].captchafailed}`] });
                        }
                    } catch (error) {
                        setErrorState({ message: [`${dictionary['auth'].captchaerror}`] });
                    }

                } else {
                    setCaptchaError(`${dictionary['auth'].captcharequired}`);
                }
            }
        } catch (error) {
            setCaptchaError(dictionary['auth'].captchaerror);
        }
    };

    // Handle closing the success modal and reset all states
    const handleCloseSuccessModal = () => {
        setOpenSuccessModal(false);
        resetState();  // Reset state after success
    };

    // Reset all states when the modal is closed
    const resetState = () => {
        setCaptchaAnswer('');  // Clear the captcha answer
        setCaptchaError('');  // Clear the error message
        setCaptchaImage(null);  // Clear captcha image
        setCaptchaId(null);  // Clear captcha ID
        setErrorState(null);  // Clear the error state
        fetchCaptcha();  // Fetch a new captcha
    };

    return (
        <>
            {/* Original Captcha Modal */}
            <Dialog
                open={openModal}
                onClose={() => {
                    handleCloseModal();
                    resetState();  // Ensure state is reset when closing modal
                }}
                maxWidth="sm"
                fullWidth
                aria-labelledby="verify-dialog-title"
            >
                <DialogTitle id="verify-dialog-title" className="text-lg font-semibold">
                    {dictionary['common'].verify}
                </DialogTitle>
                <DialogContent>
                    <p className="text-sm text-gray-900">{dictionary['auth'].completecaptcha}</p>

                    <div className="flex items-center mt-2">
                        <StyledTextField
                            fullWidth
                            label={dictionary['auth'].captcha}
                            value={captchaAnswer}
                            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setCaptchaAnswer(e.target.value)}
                            sx={{
                                '--main-color': '#3C8A6A',
                                fieldset: {
                                    borderColor: "var(--main-color) !important"
                                },
                                '& .MuiInputBase-input': {
                                    color: 'var(--main-color)'
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'var(--main-color) !important'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--main-color) !important',
                                    color: 'var(--main-color) !important'
                                },
                                '&:hover .MuiInputBase-input': {
                                    color: 'var(--main-color)'
                                },
                                '&:hover .MuiInputLabel-root': {
                                    color: 'var(--main-color) !important'
                                },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--main-color) !important',
                                    color: 'white !important'
                                },
                                '& .MuiInputBase-input.Mui-focused': {
                                    color: 'var(--main-color) !important'
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: 'var(--main-color) !important'
                                }
                            }}

                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {captchaImage && <Image src={captchaImage} alt="captcha" width={100} height={45} className="rounded-xl" />}
                                        <IconButton onClick={fetchCaptcha}>
                                            <i className="!text-[var(--main-color)] ri-refresh-line"></i>
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            error={Boolean(captchaError) || Boolean(errorState)}
                            helperText={captchaError || errorState?.message}
                        />
                    </div>
                </DialogContent>
                <DialogActions className="flex justify-between">
                    <ButtonColor variant="outlined" onClick={() => {
                        handleCloseModal();
                        resetState();  // Reset state when closing modal via "close" button
                    }}>
                        {dictionary['common'].close}
                    </ButtonColor>
                    <ButtonGradient variant="contained" onClick={handleVerifyCaptcha}>
                        {dictionary['common'].continue}
                    </ButtonGradient>
                </DialogActions>
            </Dialog>

            {/* Success Modal */}
            <Dialog
                open={openSuccessModal}
                onClose={handleCloseSuccessModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="text-lg font-semibold">
                    {dictionary['common'].verify}
                </DialogTitle>
                <DialogContent>
                    <p className="text-sm text-gray-900">{dictionary['common'].servererror}</p>
                </DialogContent>
                <DialogActions>
                    <ButtonGradient variant="contained" onClick={handleCloseSuccessModal}>
                        {dictionary['common'].close}
                    </ButtonGradient>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CardShowMoreInfo;

