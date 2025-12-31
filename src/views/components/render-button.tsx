'use client';

import { handlePostDeleteData } from '@/@core/components/cButton/handlePostDeleteData';
import { handlePostUpdateData } from '@/@core/components/cButton/handlePostUpdateData';
import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import Application from '@/@core/lib/libSupport';
import PreviewInfo from '@/components/forms/previewinfo';
import LoadingSubmit from '@/components/LoadingSubmit';
import { Locale } from '@/configs/i18n';
import { useRowSelection } from '@/contexts/RowSelectionContext';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { getIcon } from '@/utils/getIcon';
import SwalAlert from '@/utils/SwalAlert';
import { Button } from '@mui/material';
import { Box, Grid, Modal } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { checkRules } from './rule';
import { checkButtonVisibility } from './rule/checkButtonVisibility';
import { disableButton } from './rule/disableButton';
import { handleRuleExecution } from './rule/handleRuleExecution';
import { handlePostAddData } from '@/@core/components/cButton/handlePostAddData';
import { useUserStore } from '@/@core/stores/useUserStore';
import { handlePostViewData } from '@/@core/components/cButton/handlePostViewData';

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
  roleTask
}: RenderButtonDefaultProps) => {
  const [disableButtonclick, setDisableButtonClick] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Optimized: Only re-renders when role changes, not when name/avatar change
  const role = useUserStore((state) => state.role)

  const componentManager: { [key: string]: any } = rules.reduce((acc, rule) => {
    if (rule?.config?.component_manager) {
      const parsedManager = JSON.parse(rule.config.component_manager);
      return { ...acc, ...parsedManager };
    }
    return acc;
  }, {});

  const { getSelectedRows } = useRowSelection();
  const selectedRows = getSelectedRows();

  const buttonCode = input.default.code;
  const visibilityLogic = componentManager[buttonCode];

  const shouldShowButton = (() => {
    if (!visibilityLogic) return true;
    if (visibilityLogic.includes('!!!')) return !id;
    if (visibilityLogic.includes('!!')) return !!id;
    return true;
  })();

  const shouldVisibilityButton = checkButtonVisibility(rules, ismodify, buttonCode);
  const hideButton = input.config.onTable?.trim();
  if (!shouldShowButton || hideButton) return null;

  const iconClass = getIcon(input);

  const handleOpenModal = () => setIsPreview(true);
  const handleCloseModal = () => setIsPreview(false);

  const handleClick = async (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();
    setDisableButtonClick(true);
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      checkRules(rules, setDisableButtonClick, ismodify, input.default.code);

      if (input.config.useAction !== undefined) {
        if (input.config.useAction === 'true') {
          await handleRuleExecution(rules, input.default.code, setIsModify);
        } else {
          const txFo_ = JSON.parse(input.config.txFo);
          if (txFo_) {
            const txcode = txFo_[0].txcode;

            switch (txcode) {
              case '#sys:fo-post-updatedata':
                await handlePostUpdateData(session, txFo_, formMethods.getValues(), dictionary);
                break;
              case '#sys:fo-post-deletedata':
                await handlePostDeleteData(session, txFo_, selectedRows, dictionary);
                break;
              case '#sys:fo-create-dataAPI': {
                const isValid = await formMethods.trigger();
                if (!isValid) {
                  Object.entries(formMethods.formState.errors).forEach(([fieldName, error]) => {
                    formMethods.setError(fieldName, {
                      type: 'manual',
                      message: typeof error?.message === 'string' ? error.message : 'Invalid value',
                    });
                  });
                  setIsLoading(false);
                  return;
                }
                handleOpenModal();
                return;
              }
              case '#sys:fo-form-clear':
                formMethods.reset();
                break;
              case '#sys:fo-open-form': {
                const form_key = txFo_[0].input.form_key;
                const newUrl = `/${form_key}`;
                window.open(newUrl, '_blank');
                return;
              }
              case 'fo-search-API': {
                const response = await handleSearchAPI(session, txFo_, 1, 10, searchtext);
                setDatasearch(response);
                setTxFOSearch(txFo_);
                return;
              }
              case '#sys:fo-submit-dataAPI': {
                try {
                  setIsLoading(true);
                  const isValid = await formMethods.trigger();
                  if (!isValid) {
                    const firstError = Object.keys(formMethods.formState.errors)[0];
                    if (firstError) formMethods.setFocus(firstError);

                    SwalAlert(
                      'error',
                      dictionary['common']?.invalidform ?? 'Please correct the highlighted fields',
                      'center'
                    );
                    return;
                  }
                  const values = formMethods.getValues();
                  const ok = await handlePostAddData(session, txFo_, values, dictionary);
                  if (ok) {
                  }
                } catch (err) {
                  SwalAlert('error', dictionary['common']?.error ?? 'Error', 'center');
                } finally {
                  setIsLoading(false);
                }
                return;
              }

              case '#sys:view-data': {
                await handlePostViewData(txFo_, selectedRows);
                break;
              }

              default:
                SwalAlert('error', 'Unknown transaction code', 'center');
            }
          } else {
            Application.AppException('#CBUTTON.onClick', 'Error Json is undefined', 'Error');
          }
        }
      } else {
        Application.AppException('#CBUTTON.onClick', 'useAction is undefined', 'Error');
      }

    } catch (error) {
      Application.AppException('#CBUTTON.onClick', String(error), 'Error');
    } finally {
      setDisableButtonClick(false);
      setIsLoading(false);
    }

  };


  const codeHidden = input.default?.codeHidden;
  const isComponentHidden = role.some(r => {
    const roleId = r.role_id?.toString()
    return roleTask?.[roleId]?.[codeHidden]?.component?.install === false
  })
  return (

    <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
      <Button
        id={input.default.id || undefined}
        name={input.default.code}
        variant="contained"
        color="primary"
        startIcon={iconClass}
        disabled={
          disableButton(rules, buttonCode) ||
          (!shouldVisibilityButton && ismodify) ||
          input.default.disabled ||
          disableButtonclick ||
          (!ismodify && input.default.code === 'modify') ||
          (input.default.code === 'delete' && selectedRows.length === 0) ||
          isComponentHidden
        }
        onClick={handleClick}
      >
        {input.default.name || 'Button'}
      </Button>

      {isPreview && (
        <Modal open={isPreview} onClose={handleCloseModal}>
          <Box
            style={{
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
      {isLoading && (
        <LoadingSubmit loadingtext={dictionary['common'].loading} position="fixed" />
      )}
    </Grid>
  );
};

export default RenderButtonDefault;
