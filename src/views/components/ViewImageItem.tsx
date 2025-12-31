'use client'

import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { cdnServiceApi } from '@/servers/cnd-service';
import { getDictionary } from '@/utils/getDictionary';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
interface ViewImageItemProps {
  input: {
    value: string;
    default?: {
      name?: string;
      code?: string;
    };
    ismodify?: boolean;
  };
  onChangeValue?: (code: string, value: string) => void;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  session: Session | null;
}

const ViewImageItem = ({ input, onChangeValue, dictionary, session }: ViewImageItemProps) => {

  //State
  const [isUploading, setIsUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [isUploaded, setIsUploaded] = useState(false);
  const [trackerCode, setTrackerCode] = useState<string | null>(null);
  const [expiredOnUtc, setExpiredOnUtc] = useState<Date | null>(null);
  const [isTemp, setIsTemp] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>('');

  //Hooks / Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await cdnServiceApi.uploadFile({
        sessiontoken: session?.user?.token,
        file: formData
      });

      const { status, data } = res;

      if (status === 409) {
        setToastMessage(data?.message || 'Conflict: File already exists or invalid.');
        setToastSeverity('error');
        setToastOpen(true);
        return;
      }

      if (status !== 200) {
        setToastMessage(`File upload failed (${status})`);
        setToastSeverity('error');
        setToastOpen(true);
        return;
      }

      const fileUrl = data?.fileUrl;
      if (!fileUrl) {
        setToastMessage('File upload failed, no URL returned');
        setToastSeverity('error');
        setToastOpen(true);
        return;
      }

      onChangeValue?.(input.default?.code || '', fileUrl);
      setTrackerCode(data?.trackerCode || null);
      setIsTemp(data?.temp === true);
      setExpiredOnUtc(data?.expiredOnUtc ? new Date(data.expiredOnUtc) : null);

      setToastMessage('File uploaded successfully');
      setToastSeverity('success');
      setToastOpen(true);
      setEditing(false);
      setIsUploaded(true);

    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage('Unexpected error occurred during upload');
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseToast = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToastOpen(false);
  };


  useEffect(() => {
    if (!expiredOnUtc || !isTemp) return;

    const interval = setInterval(() => {
      const diff = expiredOnUtc.getTime() - new Date().getTime();
      if (diff <= 0) {
        setRemainingTime('Expired');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiredOnUtc, isTemp]);

  return (
    <Box
      sx={{
        mt: 1,
        textAlign: 'center',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #ddd',
        width: '100%',
        maxWidth: 300,
        mx: 'auto',
        position: 'relative',
        pb: 2,
      }}
    >
      <Box position="relative">
        <Image
          src={previewUrl || input.value}
          alt={input.default?.name || 'image'}
          width={324}
          height={204}
          style={{
            objectFit: 'cover',
            display: 'block',
            borderRadius: 8,
          }}
        />
        {isUploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <CircularProgress size={48} />
          </Box>
        )}
        {isUploaded && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, color: 'green' }} />
          </Box>)}
      </Box>


      {input.ismodify && !isUploaded && (
        <IconButton
          size="small"
          onClick={() => {
            if (!editing) fileInputRef.current?.click();
            setEditing(true);
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'white',
            zIndex: 2,
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload button under the image */}
      {previewUrl && !isUploaded && (
        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleUpload}
            disabled={isUploading || isUploaded}
          >
            {dictionary['common'].upload}
          </Button>
        </Box>
      )}

      {input.default?.name && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            fontStyle: 'italic',
            color: '#666',
            fontSize: '1rem',
            fontFamily: 'QuickSand, sans-serif',
          }}
        >
          {input.default.name}
        </Typography>
      )}
      {trackerCode && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: '#333',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              fontFamily: 'QuickSand, sans-serif',
            }}
          >
            <strong>{trackerCode}</strong>
          </Typography>

          {isTemp && expiredOnUtc && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'orange',
                fontSize: '0.8rem',
                fontFamily: 'QuickSand, sans-serif',
                mt: 0.5,
              }}
            >
              {dictionary['common'].temporaryuploadImage.replace('{remainingTime}', remainingTime)}
            </Typography>
          )}
        </Box>
      )}


      <SnackbarComponent
        handleCloseToast={handleCloseToast}
        toastMessage={toastMessage}
        toastOpen={toastOpen}
        toastSeverity={toastSeverity}
      />

    </Box>
  );
};

export default ViewImageItem;
