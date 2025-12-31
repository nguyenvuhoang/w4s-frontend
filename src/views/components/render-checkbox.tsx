/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { getDataConfig } from '@/@core/components/jSelect/supFunc';
import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Checkbox, FormControlLabel, Grid } from '@mui/material';
import { Session } from 'next-auth';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { disableField } from './rule/disableField';
import { isFieldHidden } from './rule/isFieldHidden';
import { isFieldRequired } from './rule/isFieldRequired';

type Props = {
  input: FormInput;
  gridProps: Record<string, number>;
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  language: Locale;
  rules: RuleStrong[];
  formMethods: ReturnType<typeof useForm>;
  onChange?: (fieldCode: string, value: string) => void;
  ismodify?: boolean;
  renderviewdata?: any;
};

const RenderCheckBoxDefault = ({
  input,
  gridProps,
  session,
  dictionary,
  language,
  rules,
  onChange,
  ismodify,
  formMethods,
  renderviewdata
}: Props) => {
  // field name (vd: 'usergroup')
  const columnKey = useMemo(
    () => input.config.structable_read.split('.').pop() || '',
    [input]
  );

  const [selectData, setSelectData] = useState<any[]>([]);
  const hasFetchedRef = useRef(false);

  // load options
  useEffect(() => {
    const fetchData = async () => {
      if (!hasFetchedRef.current) {
        const data = await getDataConfig(input.config, session, language);
        setSelectData(data || []);
        hasFetchedRef.current = true;
      }
    };
    fetchData();
  }, []);

  // map options -> {value,label}
  const options = useMemo(() => {
    const keySelected = input.config.key_selected;
    const keyDisplay = input.config.key_display;

    return (selectData || [])
      .map(item => {
        const value = keySelected
          ? item?.[keySelected] ?? item?.c_cdlist?.cdid ?? item?.codeid ?? ''
          : item?.c_cdlist?.cdid ?? item?.codeid ?? '';

        const label =
          keySelected && keyDisplay
            ? item?.[keySelected]
              ? `${item[keySelected]} - ${item?.[keyDisplay] ?? ''}`
              : item?.c_cdlist?.caption ?? item?.caption ?? ''
            : item?.c_cdlist?.caption ?? item?.caption ?? '';

        return { value: String(value), label: String(label ?? '') };
      })
      .filter(opt => opt.value !== '');
  }, [selectData, input]);

  // tính selected ban đầu (từ view data hoặc từ form)
  const selectedKey = input.config.key_selected;
  const initialSelectedValues = useMemo(() => {
    // 1) từ renderviewdata (chế độ view)
    if (renderviewdata?.[input?.default?.code]) {
      const data = renderviewdata[input.default.code];
      return Array.isArray(data)
        ? data
          .map(i => i?.[selectedKey])
          .filter(Boolean)
          .map(String)
        : [];
    }

    // 2) từ form hiện tại
    const v = formMethods.getValues(columnKey);
    if (Array.isArray(v)) return v.map(String);

    if (v && typeof v === 'object') {
      // trường hợp cũ: object { val1:true, val2:false, ... }
      return Object.entries(v)
        .filter(([, isOn]) => Boolean(isOn))
        .map(([k]) => String(k));
    }

    return [];
  }, [renderviewdata, input?.default?.code, formMethods, columnKey, selectedKey]);

  // rule/visibility/disabled
  const hidden = isFieldHidden(rules, columnKey);
  const required = isFieldRequired(input);
  const disabled = disableField(rules, columnKey, ismodify);

  // set initial vào form **một lần**, tránh ghi đè khi user đã thay đổi
  useEffect(() => {
    const current = formMethods.getValues(columnKey);
    const isUnset =
      current === undefined ||
      (Array.isArray(current) && current.length === 0) ||
      (current && typeof current === 'object' && Object.keys(current).length === 0);

    if (isUnset && initialSelectedValues.length > 0) {
      formMethods.setValue(columnKey, initialSelectedValues, { shouldDirty: false });
    }
  }, [initialSelectedValues, columnKey, formMethods]);

  if (hidden) return null;
  return (
    <Grid display={hidden ? 'none' : 'block'}>
      <Controller
        name={columnKey}
        control={formMethods.control}
        // dùng giá trị hiện tại trong form (nếu có), fallback sang initialSelectedValues
        defaultValue={
          formMethods.getValues(columnKey) ?? initialSelectedValues ?? []
        }
        rules={{
          validate: v => {
            if (!required) return true;
            const ok = Array.isArray(v) && v.length > 0;
            return (
              ok ||
              dictionary['common'].fieldrequired.replace(
                '{field}',
                input.lang?.title?.[language] || input.default?.name || columnKey
              )
            );
          }
        }}
        render={({ field, fieldState }) => {
          const selected: string[] = Array.isArray(field.value)
            ? field.value
            : [];

          const toggle = (val: string, checked: boolean) => {
            const next = checked
              ? Array.from(new Set([...selected, val]))
              : selected.filter(x => x !== val);

            field.onChange(next);
            onChange?.(columnKey, next.join(','));
          };

          return (
            <Grid container spacing={1}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {options.map(opt => {
                  const isChecked = selected.includes(opt.value);
                  return (
                    <Grid key={opt.value}
                      size={gridProps}>
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={e => toggle(opt.value, e.target.checked)}
                            disabled={disabled}
                            icon={
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  border: '2px solid rgba(13,94,52,.6)',
                                  borderRadius: '5px'
                                }}
                              />
                            }
                            checkedIcon={
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '5px',
                                  backgroundColor: 'rgb(12,84,47)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                              </Box>
                            }
                          />
                        }
                        label={opt.label}
                        sx={{
                          color: fieldState.error ? 'red' : 'inherit',
                          '& .MuiCheckbox-root': {
                            color: fieldState.error ? 'red' : 'primary.main'
                          }
                        }}
                      />
                    </Grid>
                  );
                })}
                {fieldState.error && (
                  <Box sx={{ width: '100%', color: 'error.main', fontSize: 12, mt: 0.5 }}>
                    {String(fieldState.error.message || '')}
                  </Box>
                )}
              </Box>
            </Grid>
          );
        }}
      />
    </Grid>
  );
};

export default RenderCheckBoxDefault;
