'use client';

import {
    Autocomplete,
    Checkbox,
    FormControlLabel,
    Grid,
    MenuItem,
    Switch,
    TextField
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Control, Controller, FieldValues, Path, useWatch } from 'react-hook-form';

export type SelectOption = { value: string | number; label: string };
export type OptionsLoader = () => Promise<SelectOption[]>;

type CommonFieldProps<T extends FieldValues> = {
    name: Path<T>;
    label?: string;
    placeholder?: string;
    helperText?: string;
    grid?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
    textFieldProps?: Omit<React.ComponentProps<typeof TextField>, 'name' | 'label' | 'placeholder' | 'select'>;
    disabled?: boolean | ((values: T) => boolean);
    hidden?: boolean | ((values: T) => boolean);
};

type TextFieldDef<T extends FieldValues> = CommonFieldProps<T> & {
    type: 'text' | 'number';
};

type SelectFieldDef<T extends FieldValues> = CommonFieldProps<T> & {
    type: 'select' | 'autocomplete' | 'multiselect';
    options?: SelectOption[];     // tĩnh
    loadOptions?: OptionsLoader;  // động
    freeSolo?: boolean;           // cho autocomplete
};

type CheckboxFieldDef<T extends FieldValues> = CommonFieldProps<T> & {
    type: 'checkbox' | 'switch';
};

type DateFieldDef<T extends FieldValues> = CommonFieldProps<T> & {
    type: 'date';
    format?: string; // default: 'YYYY-MM-DD'
};

type DateRangeFieldDef<T extends FieldValues> = CommonFieldProps<T> & {
    type: 'daterange';
    fromSuffix?: string; // default: '_from'
    toSuffix?: string;   // default: '_to'
    format?: string;     // default: 'YYYY-MM-DD'
};

export type FilterField<T extends FieldValues> =
    | TextFieldDef<T>
    | SelectFieldDef<T>
    | CheckboxFieldDef<T>
    | DateFieldDef<T>
    | DateRangeFieldDef<T>;

export type DynamicAdvancedFiltersProps<T extends FieldValues> = {
    control: Control<T>;
    fields: FilterField<T>[];
    headerSlot?: React.ReactNode;
    footerSlot?: React.ReactNode;
};

/** Load options (tĩnh/động) cho select-like fields */
function useResolvedOptions(field: SelectFieldDef<any>) {
    const [opts, setOpts] = useState<SelectOption[]>(field.options ?? []);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        let alive = true;
        async function run() {
            if (!field.loadOptions) return;
            setLoading(true);
            try {
                const res = await field.loadOptions!();
                if (alive) setOpts(res || []);
            } finally {
                if (alive) setLoading(false);
            }
        }
        if (field.loadOptions) run();
        return () => { alive = false; };
    }, [field.loadOptions]);

    return { options: opts, loading };
}

function evalMaybeFn<T extends FieldValues>(
    input: boolean | ((values: T) => boolean) | undefined,
    values: T
): boolean | undefined {
    if (typeof input === 'function') return (input as any)(values);
    return input;
}

function SelectLikeField<T extends FieldValues>({
    def,
    control,
    values
}: {
    def: SelectFieldDef<T>;
    control: Control<T>;
    values: T;
}) {
    const { options, loading } = useResolvedOptions(def);
    const disabled = !!evalMaybeFn(def.disabled, values);

    return (
        <Controller
            name={def.name as any}
            control={control}
            render={({ field, fieldState }) => {
                if (def.type === 'autocomplete' || def.type === 'multiselect') {
                    const multiple = def.type === 'multiselect';
                    return (
                        <Autocomplete
                            multiple={multiple}
                            freeSolo={!!def.freeSolo}
                            options={options}
                            loading={loading}
                            getOptionLabel={(opt: any) => (typeof opt === 'string' ? opt : opt?.label ?? '')}
                            isOptionEqualToValue={(opt: any, val: any) =>
                                (typeof val === 'object' ? opt?.value === val?.value : opt?.value === val)
                            }
                            value={(() => {
                                const v = field.value;
                                if (multiple) {
                                    if (Array.isArray(v)) {
                                        return v.map((x: any) => options.find(o => o.value === x) ?? { label: String(x ?? ''), value: x });
                                    }
                                    return [];
                                } else {
                                    if (v == null || v === '') return null;
                                    return options.find(o => o.value === v) ?? { label: String(v), value: v };
                                }
                            })()}
                            onChange={(_, val) => {
                                if (multiple) {
                                    const mapped = (val || []).map((o: any) => (typeof o === 'object' ? o.value : o));
                                    field.onChange(mapped);
                                } else {
                                    const mapped = val ? (typeof val === 'object' ? val.value : val) : '';
                                    field.onChange(mapped);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={def.label}
                                    placeholder={def.placeholder}
                                    size="small"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message || def.helperText}
                                    disabled={disabled}
                                    {...def.textFieldProps}
                                />
                            )}
                        />

                    );
                }

                // Simple select
                return (
                    <TextField
                        {...field}
                        select
                        fullWidth
                        size="small"
                        label={def.label}
                        placeholder={def.placeholder}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || def.helperText}
                        disabled={disabled}
                        {...def.textFieldProps}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                    >
                        {(options || []).map((opt) => (
                            <MenuItem key={`${opt.value}`} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            }}
        />
    );
}

export default function DynamicAdvancedFilters<T extends FieldValues>({
    control,
    fields,
    headerSlot,
    footerSlot
}: DynamicAdvancedFiltersProps<T>) {

    // Lấy toàn bộ values để ẩn/disable động
    const values = useWatch({ control }) as T;
    const items = useMemo(() => fields, [fields]);

    return (
        <>
            {headerSlot}
            {items.map((f, idx) => {
                const hidden = !!evalMaybeFn(f.hidden, values as T);
                if (hidden) return null;

                const size = f.grid ?? { xs: 12, sm: 6, md: 4 };

                if (f.type === 'select' || f.type === 'autocomplete' || f.type === 'multiselect') {
                    return (
                        <Grid key={`${String(f.name)}-${idx}`} size={size}>
                            <SelectLikeField<T> def={f as SelectFieldDef<T>} control={control} values={values} />
                        </Grid>
                    );
                }

                if (f.type === 'text' || f.type === 'number') {
                    return (
                        <Grid key={`${String(f.name)}-${idx}`} size={size}>
                            <Controller
                                name={f.name as any}
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        size="small"
                                        label={f.label}
                                        placeholder={f.placeholder}
                                        type={f.type === 'number' ? 'number' : 'text'}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message || f.helperText}
                                        disabled={!!evalMaybeFn(f.disabled, values)}
                                        {...f.textFieldProps}
                                        value={field.value ?? ''}
                                    />
                                )}
                            />
                        </Grid>
                    );
                }

                // CHECKBOX / SWITCH
                if (f.type === 'checkbox' || f.type === 'switch') {
                    return (
                        <Grid key={`${String(f.name)}-${idx}`} size={size} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Controller
                                name={f.name as any}
                                control={control}
                                render={({ field }) => {
                                    const checked = !!field.value;
                                    const disabled = !!evalMaybeFn(f.disabled, values);
                                    return (
                                        <FormControlLabel
                                            control={
                                                f.type === 'checkbox' ? (
                                                    <Checkbox checked={checked} onChange={(_, v) => field.onChange(v)} disabled={disabled} />
                                                ) : (
                                                    <Switch checked={checked} onChange={(_, v) => field.onChange(v)} disabled={disabled} />
                                                )
                                            }
                                            label={f.label}
                                        />
                                    );
                                }}
                            />
                        </Grid>
                    );
                }

                // DATE
                if (f.type === 'date') {
                    const fmt = f.format || 'YYYY-MM-DD';
                    return (
                        <Grid key={`${String(f.name)}-${idx}`} size={size}>
                            <Controller
                                name={f.name as any}
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        type="date"
                                        fullWidth
                                        size="small"
                                        label={f.label}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        value={field.value ? dayjs(field.value).format(fmt) : ''}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message || f.helperText}
                                        disabled={!!evalMaybeFn(f.disabled, values)}
                                        {...f.textFieldProps}
                                    />
                                )}
                            />
                        </Grid>
                    );
                }

                // DATE RANGE (name_from, name_to)
                if (f.type === 'daterange') {
                    const fmt = f.format || 'YYYY-MM-DD';
                    const fromKey = `${String(f.name)}${f.fromSuffix ?? '_from'}` as Path<T>;
                    const toKey = `${String(f.name)}${f.toSuffix ?? '_to'}` as Path<T>;
                    return (
                        <>
                            <Grid key={`${String(fromKey)}-${idx}-from`} size={size}>
                                <Controller
                                    name={fromKey as any}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            fullWidth
                                            size="small"
                                            label={`${f.label ?? String(f.name)} (from)`}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={field.value ? dayjs(field.value).format(fmt) : ''}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message || f.helperText}
                                            disabled={!!evalMaybeFn(f.disabled, values)}
                                            {...f.textFieldProps}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid key={`${String(toKey)}-${idx}-to`} size={size}>
                                <Controller
                                    name={toKey as any}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            fullWidth
                                            size="small"
                                            label={`${f.label ?? String(f.name)} (to)`}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={field.value ? dayjs(field.value).format(fmt) : ''}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message || f.helperText}
                                            disabled={!!evalMaybeFn(f.disabled, values)}
                                            {...f.textFieldProps}
                                        />
                                    )}
                                />
                            </Grid>
                        </>
                    );
                }

                return null;
            })}
            {footerSlot}
        </>
    );
}
