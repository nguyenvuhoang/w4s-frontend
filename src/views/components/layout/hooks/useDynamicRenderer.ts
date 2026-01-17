'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Session } from 'next-auth';

import { workflowService } from '@/servers/system-service';
import { FormInfo } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import SwalAlert from '@/utils/SwalAlert';
import { Locale } from '@/configs/i18n';

// ============================================================================
// Types
// ============================================================================

export interface UseDynamicRendererParams {
  formdata: any;
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  locale: Locale;
}

export interface UseDynamicRendererReturn {
  // Form state
  formMethods: ReturnType<typeof useForm>;
  dirtyFields: Record<string, boolean>;

  // Data
  layouts: any[];
  info: FormInfo;

  // UI States
  loading: boolean;
  shouldBlink: boolean;
  blinkCount: number;

  // Computed
  hasAuthentication: boolean;

  // Handlers
  handleApprove: () => void;
  handleReject: () => void;
  handleDynamicSubmit: (input: any, formValues: any) => Promise<void>;
  handleFormSubmit: (input: any) => void;
  onChangeValue: (code: string, value: any) => void;
  onChangeBanner: (input: any, bannerId: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getAllInputs = (layouts: any[]) => {
  return layouts
    .flatMap((layout) => layout.list_view)
    .flatMap((view) => view.list_input);
};

const processTableDynamicField = (
  current: any[],
  original: any[]
): any[] | null => {
  const toKey = (v: any) => v?.configKey?.toString().trim().toLowerCase();
  const originalByKey = new Map(original.map((o: any) => [toKey(o), o]));

  const toDelete = current
    .filter((row: any) => row?.isdeleted && row?.configKey)
    .map((row: any) => ({
      configKey: row.configKey,
      action: 'delete',
    }));

  const toUpsert = current
    .filter((row: any) => !row?.isdeleted)
    .filter((row: any) => {
      const key = toKey(row);
      const o = originalByKey.get(key);
      if (!o) return true;
      return (
        (row.configValue ?? '').trim() !== (o.configValue ?? '').trim() ||
        (row.description ?? '').trim() !== (o.description ?? '').trim() ||
        !!row.isactive !== !!o.isactive
      );
    })
    .map((row: any) => ({
      ...row,
      action: 'upsert',
    }));

  const changedRows = [...toUpsert, ...toDelete];
  return changedRows.length > 0 ? changedRows : null;
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useDynamicRenderer = ({
  formdata,
  session,
  dictionary,
  locale,
}: UseDynamicRendererParams): UseDynamicRendererReturn => {
  // Extract data from formdata
  const layouts = useMemo<any[]>(
    () => formdata?.form_design_detail?.list_layout ?? [],
    [formdata]
  );

  const info = useMemo<FormInfo>(
    () => (formdata?.form_design_detail?.info as FormInfo) ?? {},
    [formdata]
  );

  // Local states
  const [loading, setLoading] = useState(false);
  const [shouldBlink, setShouldBlink] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const blinkTimer = useRef<NodeJS.Timeout | null>(null);

  // Form setup
  const formMethods = useForm();
  const { handleSubmit, setValue, getValues, formState, control } = formMethods;
  const { dirtyFields } = formState;

  // Computed values
  const hasAuthentication = useMemo(
    () => layouts.some((layout) => layout.haveauthen === true),
    [layouts]
  );

  // Blink effect for success feedback
  useEffect(() => {
    if (shouldBlink && blinkCount < 6) {
      blinkTimer.current = setTimeout(() => {
        setBlinkCount((prev) => prev + 1);
      }, 300);
    }

    if (shouldBlink && blinkCount >= 6) {
      location.reload();
    }

    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, [shouldBlink, blinkCount]);

  // Value change handler
  const onChangeValue = useCallback(
    (code: string, value: any) => {
      setValue(code, value, { shouldDirty: true });
    },
    [setValue]
  );

  // Banner change handler
  const onChangeBanner = useCallback(
    (input: any, bannerId: string) => {
      const index = input.value.findIndex(
        (b: any) => b.id.toString() === bannerId
      );
      if (index === -1) return;

      const updatedList = input.value.map((b: any, i: number) => ({
        ...b,
        isdefault: i === index ? 'true' : 'false',
      }));

      setValue(input.default?.code, updatedList, { shouldDirty: true });

      // Get current default banner
      const currentBanner = updatedList.find(
        (b: any) => b.isdefault === 'true'
      );
      if (!currentBanner) return;

      // Set values for other fields based on banner properties
      Object.keys(currentBanner).forEach((key) => {
        if (key === 'isdefault') return;
        setValue(key, currentBanner[key], { shouldDirty: false });
      });
    },
    [setValue]
  );

  // Approve handler
  const handleApprove = useCallback(() => {
    setLoading(true);
    // TODO: handle approve logic
    console.log('Approve clicked');
    setLoading(false);
  }, []);

  // Reject handler
  const handleReject = useCallback(() => {
    setLoading(true);
    // TODO: handle reject logic
    console.log('Reject clicked');
    setLoading(false);
  }, []);

  // Dynamic submit handler
  const handleDynamicSubmit = useCallback(
    async (input: any, formValues: any) => {
      setLoading(true);
      try {
        const txFo = input.config?.txFo;
        if (!txFo) return;

        const tx = JSON.parse(txFo);
        const bo = tx;
        if (!bo) return;

        const allInputs = getAllInputs(layouts);
        let updatedFields: Record<string, any> = {};

        if (bo.fields && Object.keys(bo.fields).length > 0) {
          // Use predefined fields
          for (const key of Object.keys(bo.fields)) {
            const field = allInputs.find((f) => f.default?.code === key);
            updatedFields[key] = field?.value;
          }
        } else {
          // Process all fields
          for (const field of allInputs) {
            const code = field.default?.code;
            if (!code) continue;

            const original = field.value;
            const current = formValues[code];

            // Handle cTableDynamic specially
            if (
              field.inputtype === 'cTableDynamic' &&
              Array.isArray(current) &&
              Array.isArray(original)
            ) {
              const changedRows = processTableDynamicField(current, original);
              if (changedRows) {
                updatedFields[code] = changedRows;
              }
              continue;
            }

            // Handle key fields
            if (field.iskey && code && typeof field.value !== 'undefined') {
              if (field.isBanner === true) {
                updatedFields[code] = current ?? field.value;
              } else {
                updatedFields[code] = field.value;
              }
            } else if (typeof current !== 'undefined') {
              updatedFields[code] = current;
            }
          }
        }

        const payload = {
          ...bo,
          fields: updatedFields,
        };

        const submitApi = await workflowService.runDynamic({
          sessiontoken: session?.user?.token,
          body: payload,
        });

        if (
          !isValidResponse(submitApi) ||
          (submitApi.payload.dataresponse.errors &&
            submitApi.payload.dataresponse.errors.length > 0)
        ) {
          const errorString =
            'ExecutionID:' +
            submitApi.payload.dataresponse.errors[0].execute_id +
            ' - ' +
            submitApi.payload.dataresponse.errors[0].info;
          SwalAlert('error', errorString, 'center');
          setLoading(false);
          return;
        }

        const data = submitApi.payload.dataresponse.data;
        const changeField = (data?.changed_fields ?? []).map((f: string) =>
          f.toLowerCase()
        );

        // Mark changed fields
        for (const field of allInputs) {
          if (changeField.includes(field.default?.code)) {
            field.isChangedField = true;
          }
        }

        // Determine success message
        const successKeyByCode: Record<string, keyof typeof dictionary['common']> = {
          resetpassword: 'updateresetpasswordsuccess',
          modifyuser: 'updateinfosuccess',
        };
        const actionCode = (input?.default?.code ?? '').toLowerCase();
        const successKey = successKeyByCode[actionCode] ?? 'updateinfosuccess';

        SwalAlert(
          'success',
          dictionary['common'][successKey],
          'center',
          false,
          false,
          true,
          () => {
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
            setBlinkCount(0);
            setShouldBlink(true);
          },
          'OK'
        );
      } catch (error) {
        console.error('Submit error:', error);
      }
    },
    [layouts, session, dictionary]
  );

  // Form submit wrapper with confirmation
  const handleFormSubmit = useCallback(
    (input: any) => {
      SwalAlert(
        'question',
        `${dictionary['common'].areyousureprocess}`,
        'center',
        false,
        true,
        true,
        () => {
          switch (input.btntype) {
            case 'submit':
              handleSubmit((formValues) =>
                handleDynamicSubmit(input, formValues)
              )();
              break;
            case 'approve':
              handleApprove();
              break;
            case 'reject':
              handleReject();
              break;
          }
        }
      );
    },
    [dictionary, handleSubmit, handleDynamicSubmit, handleApprove, handleReject]
  );

  return {
    // Form state
    formMethods,
    dirtyFields: dirtyFields as Record<string, boolean>,

    // Data
    layouts,
    info,

    // UI States
    loading,
    shouldBlink,
    blinkCount,

    // Computed
    hasAuthentication,

    // Handlers
    handleApprove,
    handleReject,
    handleDynamicSubmit,
    handleFormSubmit,
    onChangeValue,
    onChangeBanner,
  };
};
