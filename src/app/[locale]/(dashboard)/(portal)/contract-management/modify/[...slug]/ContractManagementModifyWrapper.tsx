'use server';

import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import { PageContentProps } from '@/types';
import { createTxFo } from '@/utils/createTxFo';
import ContractManagementModifyContent from '@/views/contracts/contract-management-modify-content';


type SelectOption = { value: string; label: string };


const fetchInitialOptions = async (session: any): Promise<{
    branchOptions: SelectOption[];
    countryOptions: SelectOption[];
}> => {

    if (!session) {
        throw new Error('Session is required to fetch initial options');
    }

    const [resBranch, resCountry] = await Promise.all([
        handleSearchAPI(session, createTxFo('SimpleSearchBranch'), 1, 9999, ''),
        handleSearchAPI(session, createTxFo('SimpleSearchCountry'), 1, 9999, 'ACT'),
    ]);

    return {
        branchOptions: resBranch?.items?.map((i: any) => ({ value: i.branchid, label: i.branchname })) ?? [],
        countryOptions: resCountry?.items?.map((i: any) => ({ value: i.countrycode, label: i.countryname })) ?? [],
    };
};

const ContractManagementModifyWrapper = async ({ dictionary, locale, session, dataview }: PageContentProps) => {
    const initialOptions = await fetchInitialOptions(session);

    return (
        <ContractManagementModifyContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            contractdata={dataview}
            branchOptions={initialOptions.branchOptions}
            countryOptions={initialOptions.countryOptions}
        />
    );
};

export default ContractManagementModifyWrapper;
