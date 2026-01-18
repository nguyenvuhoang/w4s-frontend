'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Session } from 'next-auth';

import { handlePostDeleteData } from '@/@core/components/cButton/handlePostDeleteData';
import { handlePostUpdateData } from '@/@core/components/cButton/handlePostUpdateData';
import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import { handlePostAddData } from '@/@core/components/cButton/handlePostAddData';
import { handlePostViewData } from '@/@core/components/cButton/handlePostViewData';
import Application from '@/@core/lib/libSupport';
import { useUserStore } from '@/@core/stores/useUserStore';
import { useRowSelection } from '@/contexts/RowSelectionContext';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import SwalAlert from '@/utils/SwalAlert';

import { checkRules } from '../../../features/dynamicform/components/layout/rule';
import { checkButtonVisibility } from '../../../features/dynamicform/components/layout/rule/checkButtonVisibility';
import { disableButton } from '../../../features/dynamicform/components/layout/rule/disableButton';
import { handleRuleExecution } from '../../../features/dynamicform/components/layout/rule/handleRuleExecution';
import { Locale } from '@/configs/i18n';

export interface UseRenderButtonParams {
  input: FormInput;
  session: Session | null;
  id?: string | null;
  rules: RuleStrong[];
  setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
  setDatasearch: React.Dispatch<React.SetStateAction<PageData<any> | undefined>>;
  setTxFOSearch: React.Dispatch<React.SetStateAction<any>>;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  ismodify: boolean;
  setIsModify: React.Dispatch<React.SetStateAction<boolean>>;
  searchtext?: string;
  formMethods: ReturnType<typeof useForm>;
  roleTask?: any;
  language?: Locale
}

export interface UseRenderButtonReturn {
  // States
  disableButtonclick: boolean;
  isPreview: boolean;
  isLoading: boolean;
  
  // Computed values
  shouldShowButton: boolean;
  shouldVisibilityButton: boolean;
  isDisabled: boolean;
  isComponentHidden: boolean;
  selectedRows: any[];
  buttonCode: string;
  
  // Handlers
  handleClick: (e?: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  handleOpenModal: () => void;
  handleCloseModal: () => void;
  language?: Locale
}

export const useRenderButton = ({
  input,
  session,
  id,
  rules,
  setDatasearch,
  setTxFOSearch,
  dictionary,
  ismodify,
  setIsModify,
  searchtext,
  formMethods,
  roleTask,
  language
}: UseRenderButtonParams): UseRenderButtonReturn => {
  // Local states
  const [disableButtonclick, setDisableButtonClick] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Store selectors - optimized to only re-render when role changes
  const role = useUserStore((state) => state.role);

  // Row selection context
  const { getSelectedRows } = useRowSelection();
  const selectedRows = getSelectedRows();

  // Memoized computed values
  const componentManager = useMemo(() => {
    return rules.reduce<Record<string, any>>((acc, rule) => {
      if (rule?.config?.component_manager) {
        const parsedManager = JSON.parse(rule.config.component_manager);
        return { ...acc, ...parsedManager };
      }
      return acc;
    }, {});
  }, [rules]);

  const buttonCode = input.default.code;

  const shouldShowButton = useMemo(() => {
    const visibilityLogic = componentManager[buttonCode];
    if (!visibilityLogic) return true;
    if (visibilityLogic.includes('!!!')) return !id;
    if (visibilityLogic.includes('!!')) return !!id;
    return true;
  }, [componentManager, buttonCode, id]);

  const shouldVisibilityButton = useMemo(
    () => checkButtonVisibility(rules, ismodify, buttonCode),
    [rules, ismodify, buttonCode]
  );
  const isComponentHidden = useMemo(() => {
    const codeHidden = input.default?.codeHidden;
    return role.some((r) => {
      const roleId = r.role_id?.toString();
      return roleTask?.[roleId]?.[codeHidden]?.component?.install === false;
    });
  }, [role, roleTask, input.default?.codeHidden]);

  const isDisabled = useMemo(() => {
    return (
      disableButton(rules, buttonCode) ||
      (!shouldVisibilityButton && ismodify) ||
      input.default.disabled ||
      disableButtonclick ||
      (!ismodify && input.default.code === 'modify') ||
      (input.default.code === 'delete' && selectedRows.length === 0) ||
      isComponentHidden
    );
  }, [
    rules,
    buttonCode,
    shouldVisibilityButton,
    ismodify,
    input.default.disabled,
    input.default.code,
    disableButtonclick,
    selectedRows.length,
    isComponentHidden,
  ]);

  // Modal handlers
  const handleOpenModal = useCallback(() => setIsPreview(true), []);
  const handleCloseModal = useCallback(() => setIsPreview(false), []);

  // Main click handler
  const handleClick = useCallback(
    async (e?: React.MouseEvent<HTMLButtonElement>) => {
      e?.preventDefault();
      setDisableButtonClick(true);
      setIsLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 50));
        checkRules(rules, setDisableButtonClick, ismodify, input.default.code);

        if (input.config.useAction === undefined) {
          Application.AppException('#CBUTTON.onClick', 'useAction is undefined', 'Error');
          return;
        }

        if (input.config.useAction === 'true') {
          await handleRuleExecution(rules, input.default.code, setIsModify);
          return;
        }

        const txFo_ = JSON.parse(input.config.txFo);
        if (!txFo_) {
          Application.AppException('#CBUTTON.onClick', 'Error Json is undefined', 'Error');
          return;
        }

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
            const response = await handleSearchAPI(session, txFo_, 1, 10, searchtext, undefined, language);
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
              await handlePostAddData(session, txFo_, values, dictionary);
            } catch (err) {
              SwalAlert('error', dictionary['common']?.error ?? 'Error', 'center');
            } finally {
              setIsLoading(false);
            }
            return;
          }

          case '#sys:view-data':
            await handlePostViewData(txFo_, selectedRows);
            break;

          default:
            SwalAlert('error', 'Unknown transaction code', 'center');
        }
      } catch (error) {
        Application.AppException('#CBUTTON.onClick', String(error), 'Error');
      } finally {
        setDisableButtonClick(false);
        setIsLoading(false);
      }
    },
    [
      rules,
      ismodify,
      input,
      session,
      formMethods,
      dictionary,
      selectedRows,
      searchtext,
      setIsModify,
      setDatasearch,
      setTxFOSearch,
      handleOpenModal,
    ]
  );

  return {
    // States
    disableButtonclick,
    isPreview,
    isLoading,
    
    // Computed values
    shouldShowButton,
    shouldVisibilityButton,
    isDisabled,
    isComponentHidden,
    selectedRows,
    buttonCode,
    
    // Handlers
    handleClick,
    handleOpenModal,
    handleCloseModal,
  };
};
