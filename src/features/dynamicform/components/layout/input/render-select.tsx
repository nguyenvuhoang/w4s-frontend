/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { getDataConfig } from '@/@core/components/jSelect/supFunc';
import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@shared/types/systemTypes';
import { generateParams } from '@utils/generateParams';
import { getDictionary } from '@utils/getDictionary';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { Session } from 'next-auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { disableField } from '../rule/disableField';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';
import { evaluateDefault } from '@utils/evaluateDefault';

type Props = {
  input: FormInput;
  gridProps: Record<string, number>;
  onChange?: (fieldCode: string, value: string) => void;
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  language: Locale;
  rules: RuleStrong[];
  renderviewdata?: any;
  ismodify?: boolean;
  formMethods: ReturnType<typeof useForm>;
};

const RenderSelectDefault = ({
  input,
  gridProps,
  onChange,
  session,
  dictionary,
  language,
  rules,
  renderviewdata,
  ismodify,
  formMethods,
}: Props) => {
  const columnKey = input.config.structable_read.split('.').pop();
  const defaultValue = renderviewdata?.[input.default?.code] ?? evaluateDefault(input.config?.data_default || '') ?? '';

  const [selectData, setSelectData] = useState<any[]>([]);
  const hasFetchedRef = useRef(false);

  const parameter = useMemo(() => {
    return generateParams(input.config.col_filter, formMethods.getValues());
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (hasFetchedRef.current) return;

    const fetchData = async () => {
      const data = await getDataConfig(input.config, session, language, parameter);
      if (isMounted) {
        setSelectData(data);
        hasFetchedRef.current = true;
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const required = isFieldRequired(input);
  const hidden = isFieldHidden(rules, columnKey);
  const disable = disableField(rules, columnKey, ismodify);

  const options = selectData.map((item: any) => {
    const keySelected = input.config.key_selected;
    const keyDisplay = input.config.key_display;
    const value = keySelected ? item[keySelected] || item.c_cdlist?.cdid || item?.codeid || '' : item.c_cdlist?.cdid || item?.codeid || '';
    const label = keySelected && keyDisplay
      ? item[keySelected]
        ? item[keySelected] + '-' + (item[keyDisplay] || '')
        : item.c_cdlist?.caption || item?.caption || ''
      : item.c_cdlist?.caption || item?.caption || '';
    return { value, label };
  });

  const currentValue = formMethods.getValues(columnKey) || defaultValue;

  const isValidValue = options.some(option => option.value === currentValue);
  const safeValue = currentValue || evaluateDefault(input.config?.data_default || '');

  useEffect(() => {
    if (safeValue && safeValue !== formMethods.getValues(columnKey)) {
      formMethods.setValue(columnKey, safeValue, { shouldValidate: true, shouldDirty: true });
    }
  }, [safeValue]);

  if (hidden) return null;

  return (
    <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
      <Controller
        name={columnKey}
        control={formMethods.control}
        defaultValue={safeValue}
        rules={{
          required: required
            ? `${dictionary['common'].fieldrequired.replace('{field}', input.lang?.title?.[language] || input.default?.name)}`
            : false,
        }}
        render={({ field, fieldState }) => {
          return (
            <FormControl fullWidth size="small" error={!!fieldState.error} variant="outlined">
              <InputLabel id={`${input.default.code}-label`} htmlFor={`${input.default.code}`}>
                {input.default.name || 'Select Option'}
              </InputLabel>
              <Select
                displayEmpty
                id={`${input.default.code}`}
                {...field}
                labelId={`${input.default.code}-label`}
                value={field.value ?? ''}
                onChange={async (e) => {
                  const selectedValue = e.target.value;
                  field.onChange(selectedValue);
                  await formMethods.trigger(columnKey);
                  onChange?.(input.default.code, selectedValue);
                }}
                label={input.default.name || 'Select Option'}
                disabled={disable}
                sx={{
                  '&.MuiOutlinedInput-root': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#048d48a1 !important',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8e8e8e !important',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#03492a !important',
                    },
                    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d32f2f !important',
                    },
                  },
                }}
              >
                {options.map((option, index) => (
                  <MenuItem key={index} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              {required && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: '40px',
                    top: fieldState.error ? '15%' : '50%',
                    transform: fieldState.error ? '' : 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: fieldState.error ? 'spin 1s linear infinite' : 'none',
                  }}
                >
                  <AcUnitIcon sx={{ color: 'red', fontSize: '16px' }} />
                </Box>
              )}

              {fieldState.error && (
                <Box sx={{ color: 'red', mt: 1, fontSize: '0.75rem' }}>
                  {fieldState.error.message}
                </Box>
              )}
            </FormControl>
          )
        }}
      />
    </Grid>
  );
};

export default RenderSelectDefault;

