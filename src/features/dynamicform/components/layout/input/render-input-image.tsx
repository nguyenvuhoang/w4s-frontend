'use client';

import { Locale } from '@/configs/i18n';
import { cdnServiceApi } from '@/servers/cnd-service';
import { FormInput, RuleStrong } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Box, Button, FormHelperText, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { Session } from 'next-auth';
import Image from 'next/image';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { disableField } from '../rule/disableField';
import { generateControlValue } from '../rule/generateControlValue';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';
import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { is } from 'valibot';

type Props = {
  session: Session | null;
  input: FormInput;
  gridProps: Record<string, number>;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  language: Locale;
  rules: RuleStrong[];
  onChange?: (fieldCode: string, value: any) => void;
  renderviewdata?: any;
  ismodify?: boolean;
  fetchControlDefaultValue?: boolean;
  setFetchControlDefaultValue?: Dispatch<SetStateAction<boolean>>;
  formMethods: ReturnType<typeof useForm>;
};

type StoreMode = 'dataurl' | 'file';

const RenderImageUpload = ({
  session,
  input,
  gridProps,
  dictionary,
  language,
  rules,
  onChange,
  renderviewdata,
  ismodify,
  fetchControlDefaultValue,
  setFetchControlDefaultValue,
  formMethods
}: Props) => {
  const columnKey = input.config.structable_read.split('.').pop()!;
  const required = isFieldRequired(input);
  const hidden = isFieldHidden(rules, columnKey);
  const disabled = disableField(rules, columnKey, ismodify);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  // Configs
  const accept = (input?.config?.accept as string) || 'image/*';
  const maxSizeMB = Number(input?.config?.max_size_mb) || 5;
  const storeMode: StoreMode = (input?.config?.store as StoreMode) || 'dataurl';

  const [controlValue, setControlValue] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchControlValue = async () => {
      const v = await generateControlValue(session, columnKey, rules);
      if (!v) return;
      const finalValue = v || '';
      setControlValue(finalValue);
      formMethods.setValue(columnKey, finalValue as any, { shouldValidate: true });
      setFetchControlDefaultValue && setFetchControlDefaultValue(true);
    };
    if (!fetchControlDefaultValue) fetchControlValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchControlDefaultValue]);

  const getDefaultValue = () => {
    if (!input.config?.data_value) {
      return renderviewdata?.[input.default?.code] ?? controlValue ?? '';
    }
    const keyToFind = input.config.data_value;
    const v = formMethods.getValues(keyToFind);
    return v ?? renderviewdata?.[input.default?.code] ?? controlValue ?? '';
  };

  const labelText = input.lang?.title?.[language] || input.default?.name || 'Image';

  // Validation rule message
  const requiredMessage = required
    ? dictionary['common'].fieldrequired.replace('{field}', labelText)
    : false;

  // Local ephemeral revoke for createObjectURL
  useEffect(() => {
    // Revoke object URL when component unmount or value changes to avoid memory leak
    return () => {
      const val = formMethods.getValues(columnKey);
      if (val instanceof File) {
        try {
          const u = URL.createObjectURL(val);
          URL.revokeObjectURL(u);
        } catch { }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handlePick = () => fileInputRef.current?.click();

  const handleClear = () => {
    formMethods.setValue(columnKey, '', { shouldValidate: true });
    onChange?.(columnKey, '');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    formMethods.trigger(columnKey);
  };



  const handleAcceptUpload = async () => {
    try {
      setIsUploading(true);
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        formMethods.setError(columnKey, { type: 'validate', message: 'No image selected' });
        return;
      }
      const formData = new FormData();
      formData.append('file', file);

      console.log("folderUpload: ", input?.config?.folder_upload);
      const res = await cdnServiceApi.uploadFile({
        sessiontoken: session?.user?.token,
        file: formData,
        folderUpload: input?.config?.folder_upload as string | undefined
      });

      const { status, data } = res;

      if (status === 409) {
        formMethods.setError(columnKey, { type: 'validate', message: data?.message || 'Conflict' });
        await formMethods.trigger(columnKey);
        formMethods.setFocus(columnKey);
        setToastMessage(data?.message);
        setToastSeverity('error');
        setToastOpen(true);
        return;
      }

      if (status !== 200) {
        formMethods.setError(columnKey, { type: 'validate', message: `File upload failed (${status})` });
        await formMethods.trigger(columnKey);
        formMethods.setFocus(columnKey);
        return;
      }

      const fileUrl = data?.fileUrl;
      if (!fileUrl) {
        formMethods.setError(columnKey, { type: 'validate', message: 'No URL returned' });
        await formMethods.trigger(columnKey);
        formMethods.setFocus(columnKey);
        return;
      }

      formMethods.setValue(columnKey, fileUrl, { shouldValidate: true });
      onChange?.(input.default?.code || columnKey, fileUrl);
      setPreviewUrl(fileUrl);
      setToastMessage('File uploaded successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (e: any) {
      formMethods.setError(columnKey, { type: 'validate', message: e?.message || 'Unexpected upload error' });
      await formMethods.trigger(columnKey);
      formMethods.setFocus(columnKey);
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

  return (
    <Grid size={gridProps} sx={{ marginBottom: '16px' }} display={hidden ? 'none' : 'block'}>
      <Controller
        name={columnKey}
        control={formMethods.control}
        defaultValue={getDefaultValue()}
        rules={{ required: requiredMessage as any }}
        render={({ field, fieldState }) => (
          <Box
            sx={{
              border: '1px dashed #048d48a1',
              borderRadius: 2,
              p: 2,
              position: 'relative',
              ...(disabled && { opacity: 0.6, pointerEvents: 'none' })
            }}
          >
            {/* Label + required asterisk (giá»¯ style tÆ°Æ¡ng tá»±) */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2">
                {labelText}
                {required && <span style={{ color: 'red', marginLeft: 4 }}>*</span>}
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box
                sx={{
                  width: '100%',
                  height: 160,
                  borderRadius: 2,
                  border: '1px solid #ccc',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa'
                }}
              >
                {previewUrl ? (
                  <Image
                    width={1280}
                    height={720}
                    alt="preview"
                    src={previewUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {dictionary['common'].nopicselected || 'No image selected'}
                  </Typography>
                )}
              </Box>

              {previewUrl && (
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Tooltip title={isUploading ? 'Uploading...' : 'Accept & Upload'}>
                    <span>
                      <IconButton
                        size="medium"
                        color="primary"
                        onClick={handleAcceptUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title="Remove">
                    <span>
                      <IconButton size="medium" color="error" onClick={handleClear} disabled={isUploading}>
                        <DeleteForeverIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              )}

              {/* hÃ ng chá»n áº£nh */}
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                alignItems="center"
                sx={{ width: '100%', mt: 1 }}
              >
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<CloudUploadIcon />}
                  onClick={handlePick}
                  sx={{ minWidth: 160, py: 1 }}
                  disabled={isUploading}
                >
                  {previewUrl ? 'Change image' : 'Upload image'}
                </Button>

              </Stack>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 1 }}>
                <FormHelperText
                  error={!!fieldState.error}
                  sx={{ textAlign: 'center' }}
                >
                  {fieldState.error?.message ||
                    `Accepted: ${accept}. Max ${maxSizeMB}MB.`}
                </FormHelperText>
              </Box>

            </Stack>

            {/* Hidden input file */}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={disabled}
            />
          </Box>
        )}
      />
      <SnackbarComponent
        handleCloseToast={handleCloseToast}
        toastMessage={toastMessage}
        toastOpen={toastOpen}
        toastSeverity={toastSeverity}
      />

    </Grid>
  );
};

export default RenderImageUpload;

