'use client';

import { Session } from 'next-auth';
import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';

import PreviewInfo from '@/components/forms/previewinfo';
import LoadingSubmit from '@/components/LoadingSubmit';
import { Locale } from '@/configs/i18n';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { getIcon } from '@/utils/getIcon';
import { useRenderButton } from '@/views/components/hooks';
import { Box, Button, Grid, Modal } from '@mui/material';


// ============================================================================
// Types
// ============================================================================

export type RenderButtonDefaultProps = {
  input: FormInput;
  session: Session | null;
  id?: string | null;
  rules: RuleStrong[];
  setIsFetching: Dispatch<SetStateAction<boolean>>;
  setDatasearch: Dispatch<SetStateAction<PageData<any> | undefined>>;
  setTxFOSearch: Dispatch<SetStateAction<any>>;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  language: Locale;
  gridProps: Record<string, number>;
  ismodify: boolean;
  setIsModify: Dispatch<SetStateAction<boolean>>;
  searchtext?: string;
  formMethods: ReturnType<typeof useForm>;
  roleTask?: any;
};

// ============================================================================
// Component
// ============================================================================

const RenderButtonDefault = ({
  input,
  gridProps,
  id,
  rules,
  session,
  setIsFetching,
  setDatasearch,
  dictionary,
  language,
  setTxFOSearch,
  ismodify,
  setIsModify,
  searchtext,
  formMethods,
  roleTask,
}: RenderButtonDefaultProps) => {
  // All logic is encapsulated in the custom hook
  const {
    isPreview,
    isLoading,
    shouldShowButton,
    isDisabled,
    handleClick,
    handleCloseModal,
  } = useRenderButton({
    input,
    session,
    id,
    rules,
    setIsFetching,
    setDatasearch,
    setTxFOSearch,
    dictionary,
    ismodify,
    setIsModify,
    searchtext,
    formMethods,
    roleTask,
    
  });

  // Early return for hidden buttons
  const hideButton = input.config.onTable?.trim();
  if (!shouldShowButton || hideButton) return null;

  const iconClass = getIcon(input);
  return (
    <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
      {/* Main Button */}
      <Button
        id={input.default.id || undefined}
        name={input.default.code}
        variant="contained"
        color="primary"
        startIcon={iconClass}
        disabled={isDisabled}
        onClick={handleClick}
      >
        {input.default.name || 'Button'}
      </Button>

      {/* Preview Modal */}
      {isPreview && (
        <Modal open={isPreview} onClose={handleCloseModal}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
            }}
          >
            <PreviewInfo
              content={formMethods.getValues()}
              onClose={handleCloseModal}
              dictionary={dictionary}
              input={input}
              language={language}
              session={session}
            />
          </Box>
        </Modal>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSubmit loadingtext={dictionary['common'].loading} position="fixed" />
      )}
    </Grid>
  );
};

export default RenderButtonDefault;
