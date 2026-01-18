import { handlePostDeleteData } from '@/@core/components/cButton/handlePostDeleteData';
import { handlePostUpdateData } from '@/@core/components/cButton/handlePostUpdateData';
import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import { handlePostAddData } from '@/@core/components/cButton/handlePostAddData';
import { handlePostViewData } from '@/@core/components/cButton/handlePostViewData';
import { Locale } from '@/configs/i18n';

type PerformParams = {
    txcode: string;
    txFo: any;
    session: any;
    formValues?: any;
    selectedRows?: any[];
    dictionary?: any;
    searchtext?: string;
    language?: Locale;
};

export const performTransaction = async ({
    txcode,
    txFo,
    session,
    formValues,
    selectedRows,
    dictionary,
    searchtext,
    language,
}: PerformParams) => {
    switch (txcode) {
        case '#sys:fo-post-updatedata':
            return await handlePostUpdateData(session, txFo, formValues, dictionary);

        case '#sys:fo-post-deletedata':
            return await handlePostDeleteData(session, txFo, selectedRows, dictionary);

        case 'fo-search-API': {
            const resp = await handleSearchAPI(session, txFo, 1, 10, searchtext, undefined, language);
            return { type: 'search', payload: resp };
        }

        case '#sys:fo-submit-dataAPI':
            return await handlePostAddData(session, txFo, formValues, dictionary);

        case '#sys:view-data':
            return await handlePostViewData(txFo, selectedRows);

        default:
            return { error: 'Unknown txcode' };
    }
};

export default performTransaction;
