'use client'

import FormField from '@/@core/components/form-field'
import { cdnServiceApi } from '@/servers/cnd-service'
import { PageContentProps } from '@/types'
import SwalAlert from '@/utils/SwalAlert'
import BadgeIcon from '@mui/icons-material/Badge'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import FaceIcon from '@mui/icons-material/Face'
import FolderSharedIcon from '@mui/icons-material/FolderShared'
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
const KYCStep = ({ dictionary, session }: PageContentProps) => {



  const { control, formState: { errors }, getValues, setValue, register } = useFormContext()
  const nrcFrontFile = useWatch({ control, name: 'nrc_front' })
  const nrcBackFile = useWatch({ control, name: 'nrc_back' })
  const selfieNrcFile = useWatch({ control, name: 'selfie_nrc' })

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [errorFields, setErrorFields] = useState<Partial<Record<'nrc_front' | 'nrc_back' | 'selfie_nrc', string>>>({});

  const [uploadedUrls, setUploadedUrls] = useState<{
    nrc_front?: string
    nrc_back?: string
    selfie_nrc?: string
  }>({})


  const renderImagePreview = (file: File | string | null, error?: string) => {
    if (!file) return null;

    let previewUrl = '';

    if (typeof file === 'string') {
      previewUrl = file;
    } else if (file instanceof Blob) {
      previewUrl = URL.createObjectURL(file);
    } else {
      console.error('Invalid file type:', file);
      return null;
    }

    return (
      <Box sx={{ border: error ? '2px solid red' : 'none', borderRadius: 2, p: 0.5 }}>
        <Image
          src={previewUrl}
          alt="preview"
          width={200}
          height={200}
          style={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'contain',
            borderRadius: 8
          }}
        />
        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Typography
              variant="caption"
              color="error"
              sx={{
                mt: 0.5,
                fontFamily: 'Quicksand'
              }}
            >
              {error}
            </Typography>
          </Box>
        )}


      </Box>

    );
  };


  const renderFileNamePreview = (file: string) => {
    const getFileName = (url: string): string => url.split('/').pop() ?? '';
    return (
      <Typography
        variant="body2"
        color="primary.main"
        sx={{
          mt: 1,
          textAlign: 'center',
          fontFamily: 'Quicksand'
        }}
      >
        {getFileName(file)}
      </Typography>
    );
  };


  const uploadSingleFile = async (key: 'nrc_front' | 'nrc_back' | 'selfie_nrc', file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await cdnServiceApi.uploadFile({
      sessiontoken: session?.user?.token,
      file: formData
    });

    const { status, data } = res;

    if (status === 409) {
      setErrorFields(prev => ({ ...prev, [key]: data?.message || 'This file has been used before' }));
      throw new Error(data?.message || 'This file has been used before');
    }

    const fileUrl = data?.fileUrl;
    if (!fileUrl) {
      throw new Error(data?.message || 'File URL not returned');
    }

    setUploadedUrls(prev => ({ ...prev, [key]: fileUrl }));

    const fieldMap: Record<typeof key, string> = {
      nrc_front: 'nrc_front',
      nrc_back: 'nrc_back',
      selfie_nrc: 'selfie_nrc'
    };

    setValue(fieldMap[key], fileUrl);
  };



  const handleUpload = async () => {
    setErrorFields({});
    if (!nrcFrontFile || !nrcBackFile || !selfieNrcFile) {
      alert('Please select all files')
      return
    }

    const values = getValues()
    const nrcNumber = values.nrc_number
    if (!nrcNumber || nrcNumber.trim() === '') {
      SwalAlert('warning', dictionary['contract'].enternrcnumber, 'center')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    try {
      await uploadSingleFile('nrc_front', nrcFrontFile)
      setUploadProgress(1)

      await uploadSingleFile('nrc_back', nrcBackFile)
      setUploadProgress(2)

      await uploadSingleFile('selfie_nrc', selfieNrcFile)
      setUploadProgress(3)

      setValue('is_uploaded', true, { shouldValidate: true })
      SwalAlert('success', 'KYC uploaded successfully', 'center')
    } catch (error) {
      setValue('is_uploaded', false)
      SwalAlert('error', (error as { message?: string }).message || 'Upload failed', 'center')
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    // Đăng ký trường nếu chưa được
    register('is_uploaded', {
      validate: value => value === true || dictionary['common']?.kycnotuploaded || 'KYC upload not completed'
    })
  }, [register, dictionary])


  useEffect(() => {
    if (errors.is_uploaded) {
      SwalAlert('warning', errors.is_uploaded.message?.toString() || 'KYC upload not completed', 'center')
    }
  }, [errors.is_uploaded])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Title */}
      <Typography variant="h6" fontWeight="bold">
        {dictionary['contract']?.kycinformation || 'National Registration Card (KYC)'}
      </Typography>

      {/* NRC Number */}
      <FormField
        name="nrc_number"
        control={control}
        errors={errors}
        label={dictionary['contract']?.nrcnumber || 'NRC Number'}
        placeholder="Enter NRC number"
        type="text"
        required
        rules={{
          required: dictionary['contract']?.nrcnumber || 'NRC number is required'
        }}
      />

      {/* Image Upload Fields */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="nrc_front"
            control={control}
            errors={errors}
            label={dictionary['contract']?.nrcfront || 'NRC Front'}
            type="file"
            placeholder={dictionary['contract']?.uploadnrcfront || 'Upload NRC front image'}
            required
            rules={{
              required: `${dictionary['contract']?.nrcfront} ${dictionary['common'].required}` || 'NRC front image is required'
            }}
          />
          {nrcFrontFile && renderImagePreview(nrcFrontFile, errorFields.nrc_front)}
          {uploadedUrls.nrc_front && renderFileNamePreview(uploadedUrls.nrc_front || '')}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="nrc_back"
            control={control}
            errors={errors}
            label={dictionary['contract']?.nrcback || 'NRC Back'}
            type="file"
            placeholder={dictionary['contract']?.uploadnrcback || 'Upload NRC back image'}
            required
            rules={{
              required: `${dictionary['contract']?.nrcback} ${dictionary['common'].required}` || 'NRC back image is required'
            }}
          />
          {nrcBackFile && renderImagePreview(nrcBackFile, errorFields.nrc_back)}
          {uploadedUrls.nrc_back && renderFileNamePreview(uploadedUrls.nrc_back || '')}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="selfie_nrc"
            control={control}
            errors={errors}
            label={dictionary['contract']?.selfienrc || 'Selfie With NRC'}
            type="file"
            placeholder={dictionary['contract']?.uploadselfienrc || 'Upload selfie with NRC'}
            required
            rules={{
              required: `${dictionary['contract']?.selfienrc} ${dictionary['common'].required}` || 'Selfie with NRC is required'
            }}
          />
          {selfieNrcFile && renderImagePreview(selfieNrcFile, errorFields.selfie_nrc)}
          {uploadedUrls.selfie_nrc && renderFileNamePreview(uploadedUrls.selfie_nrc || '')}
        </Grid>

        <Grid
          size={{ xs: 12, md: 12 }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            pointerEvents: isUploading ? 'none' : 'auto',
            opacity: isUploading ? 0.5 : 1
          }}
        >
          {nrcFrontFile && nrcBackFile && selfieNrcFile && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {dictionary['common'].uploadkyc || 'Upload KYC'}
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Overlay Loading Spinner */}
      {isUploading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FolderSharedIcon
            sx={{
              fontSize: 64,
              color: '#4caf50',
              mb: 2,
              animation: 'bounce 1s infinite',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-12px)' }
              }
            }}
          />
          <Box display="flex" gap={3} mb={3}>
            <BadgeIcon sx={{ fontSize: 40, color: uploadProgress >= 1 ? '#4caf50' : '#9e9e9e' }} />
            <CreditCardIcon sx={{ fontSize: 40, color: uploadProgress >= 2 ? '#4caf50' : '#9e9e9e' }} />
            <FaceIcon sx={{ fontSize: 40, color: uploadProgress >= 3 ? '#4caf50' : '#9e9e9e' }} />
          </Box>
          <CircularProgress size={40} />
        </Box>
      )}
    </Box>
  )
}

export default KYCStep
