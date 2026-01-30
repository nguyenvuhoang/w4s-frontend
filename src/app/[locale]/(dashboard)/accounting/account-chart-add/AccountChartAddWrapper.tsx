'use server';

import { handleGetCodeList } from '@/@core/components/cButton/handleGetCodeList';
import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import { Locale } from '@/configs/i18n';
import { PageContentProps } from '@shared/types';
import { createTxFo } from '@utils/createTxFo';
import AccountChartAddContent from '@/views/accounting/account-chart-add-content';


type SelectOption = { value: string; label: string };


const fetchInitialOptions = async (session: any, locale: Locale): Promise<{
    accountLevelOptions: SelectOption[];
    accountClassificationOptions: SelectOption[];
    accountCategoriesOptions: SelectOption[];
    accountGroupOptions: SelectOption[];
    branchOptions: SelectOption[];
}> => {

    if (!session) {
        throw new Error('Session is required to fetch initial options');
    }
    const [resAccountLevel, resAccountClassification, resAccountCategories, resAccountGroup, resBranch] = await Promise.all([
        handleGetCodeList(session, 'ACT', 'ACLVL', locale),
        handleGetCodeList(session, 'ACT', 'ACCLS', locale),
        handleGetCodeList(session, 'ACT', 'ACCAT', locale),
        handleGetCodeList(session, 'ACT', 'ACGRP', locale),
        handleSearchAPI(session, createTxFo('SimpleSearchBranch'), 1, 9999, ''),

    ]);

    return {
        accountLevelOptions: resAccountLevel?.items?.map((i: any) => ({ value: i.codeid, label: i.caption })) ?? [],
        accountClassificationOptions: resAccountClassification?.items?.map((i: any) => ({ value: i.codeid, label: i.caption })) ?? [],
        accountCategoriesOptions: resAccountCategories?.items?.map((i: any) => ({ value: i.codeid, label: i.caption })) ?? [],
        accountGroupOptions: resAccountGroup?.items?.map((i: any) => ({ value: i.codeid, label: i.caption })) ?? [],
        branchOptions: resBranch?.items?.map((i: any) => ({ value: i.branchid, label: `${i.branchid} - ${i.branchname}` })) ?? [],
    };

};

const AccountChartAddWrapper = async ({ dictionary, locale, session, dataview }: PageContentProps) => {
    const initialOptions = await fetchInitialOptions(session, locale);

    return (
        <AccountChartAddContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            accountlevelOptions={initialOptions.accountLevelOptions}
            accountClassificationOptions={initialOptions.accountClassificationOptions}
            accountCategoriesOptions={initialOptions.accountCategoriesOptions}
            accountGroupOptions={initialOptions.accountGroupOptions}
            branchOptions={initialOptions.branchOptions}
        />
    );
};

export default AccountChartAddWrapper;
