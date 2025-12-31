'use server';

import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import { PageContentProps } from '@/types';
import { createTxFo } from '@/utils/createTxFo';
import ContractManagementAddContent from '@/views/contracts/contract-management-add-content';


type SelectOption = { value: string; label: string };


const fetchInitialOptions = async (session: any): Promise<{
    branchOptions: SelectOption[];
    countryOptions: SelectOption[];
    cityOptions: SelectOption[];
}> => {

    if (!session) {
        throw new Error('Session is required to fetch initial options');
    }

    const [resBranch, resCountry, resCity] = await Promise.all([
        handleSearchAPI(session, createTxFo('SimpleSearchBranch'), 1, 9999, ''),
        handleSearchAPI(session, createTxFo('SimpleSearchCountry'), 1, 9999, 'ACT'),
        handleSearchAPI(session, createTxFo('SimpleSearchCityOption'), 1, 9999, ''),
    ]);
    
    return {
        branchOptions: resBranch?.items?.map((i: any) => ({ value: i.branchid, label: i.branchname })) ?? [],
        countryOptions: resCountry?.items?.map((i: any) => ({ value: i.countrycode, label: i.countryname })) ?? [],
        cityOptions: resCity?.items?.map((i: any) => ({ value: i.citycode, label: i.cityname })) ?? [],
    };
};

const ContractManagementAddWrapper = async ({ dictionary, locale, session, dataview }: PageContentProps) => {
    const initialOptions = await fetchInitialOptions(session);

    return (
        <ContractManagementAddContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            contractdata={dataview}
            branchOptions={initialOptions.branchOptions}
            countryOptions={initialOptions.countryOptions}
            cityOptions={initialOptions.cityOptions}
        />
    );
};

export default ContractManagementAddWrapper;
