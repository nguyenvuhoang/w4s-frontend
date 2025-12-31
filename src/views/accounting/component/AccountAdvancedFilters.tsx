'use client';

import DynamicAdvancedFilters, { FilterField, SelectOption } from '@/views/components/form/DynamicAdvancedFilters';
import { Control, FieldValues } from 'react-hook-form';
import { useCallback, useMemo } from 'react';

type Props<T extends FieldValues> = {
    control: Control<T>;
    dictionary?: any;
    accountClassificationOptions: SelectOption[];
    accountLevelOptions: SelectOption[];
};

export default function AccountAdvancedFilters<T extends FieldValues>({
    control,
    dictionary,
    accountClassificationOptions,
    accountLevelOptions
}: Props<T>) {
    const dict = useMemo(
        () => ({
            accountnumber: dictionary?.accountchart?.accountnumber ?? 'Account number',
            accountname: dictionary?.accountchart?.accountname ?? 'Account name',
            accLevelFrom: dictionary?.accountchart?.accountlevelfrom ?? 'Account level from',
            accLevelTo: dictionary?.accountchart?.accountlevelto ?? 'Account level to',
            currency: dictionary?.common?.currency ?? 'Currency',
            classification: dictionary?.accountchart?.classification ?? 'Classification',
            balanceside: dictionary?.accountchart?.balanceside ?? 'Balance side',
            group: dictionary?.accountchart?.group ?? 'Group',
            status: dictionary?.common?.status ?? 'Status',
            all: dictionary?.common?.all ?? 'All',
        }),
        [dictionary]
    );

    const loadCurrencyOptions = useCallback(async (): Promise<SelectOption[]> => {
        return [
            { value: 'ALL', label: dict.all },
            { value: 'LAK', label: 'LAK' },
            { value: 'USD', label: 'USD' },
        ];
    }, [dict.all]);

    const loadBalanceSideOptions = useCallback(async (): Promise<SelectOption[]> => {
        return [
            { value: 'ALL', label: dict.all },
            { value: 'D', label: 'Debit' },
            { value: 'C', label: 'Credit' },
            { value: 'B', label: 'Both' },
        ];
    }, [dict.all]);

    const loadGroupOptions = useCallback(async (): Promise<SelectOption[]> => {
        const safe = (accountLevelOptions ?? []).filter(
            (o): o is SelectOption => o && o.value != null && o.label != null
        );
        const hasAll = safe.some(o => String(o.value) === 'ALL');
        return hasAll ? safe : [{ value: 'ALL', label: dict.all }, ...safe];
    }, [accountLevelOptions, dict.all]);

    const loadClassificationOptions = useCallback(async (): Promise<SelectOption[]> => {
        const safe = (accountClassificationOptions ?? []).filter(
            (o): o is SelectOption => o && o.value != null && o.label != null
        );
        const hasAll = safe.some(o => String(o.value) === 'ALL');
        return hasAll ? safe : [{ value: 'ALL', label: dict.all }, ...safe];
    }, [accountClassificationOptions, dict.all]);

    const fields: FilterField<T>[] = useMemo(
        () => [
            {
                type: 'text',
                name: 'accountnumber' as any,
                label: dict.accountnumber,
                placeholder: dict.accountnumber,
                grid: { xs: 12, sm: 6, md: 4 },
            },
            {
                type: 'number',
                name: 'accountlevelfrom' as any,
                label: dict.accLevelFrom,
                placeholder: dict.accLevelFrom,
                grid: { xs: 12, sm: 6, md: 4 },
            },
            {
                type: 'number',
                name: 'accountlevelto' as any,
                label: dict.accLevelTo,
                placeholder: dict.accLevelTo,
                grid: { xs: 12, sm: 6, md: 4 },
            },
            {
                type: 'select',
                name: 'currency' as any,
                label: dict.currency,
                grid: { xs: 12, sm: 6, md: 4 },
                loadOptions: loadCurrencyOptions,
            },
            {
                type: 'text',
                name: 'accountname' as any,
                label: dict.accountname,
                placeholder: dict.accountname,
                grid: { xs: 12, sm: 6, md: 4 },
            },
            {
                type: 'select',
                name: 'balanceside' as any,
                label: dict.balanceside,
                grid: { xs: 12, sm: 6, md: 4 },
                loadOptions: loadBalanceSideOptions,
            },
            {
                type: 'select',
                name: 'classification' as any,
                label: dict.classification,
                grid: { xs: 12, sm: 6, md: 4 },
                loadOptions: loadClassificationOptions,
            },
            {
                type: 'select',
                name: 'group' as any,
                label: dict.group,
                grid: { xs: 12, sm: 6, md: 4 },
                loadOptions: loadGroupOptions,
            },
        ],
        [
            dict,
            loadCurrencyOptions,
            loadBalanceSideOptions,
            loadClassificationOptions,
            loadGroupOptions,
        ]
    );

    return <DynamicAdvancedFilters<T> control={control} fields={fields} />;
}
