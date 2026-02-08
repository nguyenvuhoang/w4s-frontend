import { auth } from '@/auth';
import { generateAuthMetadata } from '@components/layout/AuthLayout';
import Spinner from '@components/spinners';
import { Locale } from '@/configs/i18n';
import { systemServiceApi, workflowService } from '@/servers/system-service';
import { LanguageDataMobileType, PageLanguageResponse } from '@shared/types/bankType';
import { getDictionary } from '@utils/getDictionary';
import { isValidResponse } from '@utils/isValidResponse';
import LanguageManagementContent from '@/views/language-management';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Language management');

type PageProps = {
    params: Promise<{ locale: Locale }>;
};

const LanguageManagement = async (props: PageProps) => {
    const params = await props.params;
    const { locale } = params;

    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()]);

    // 1) Load dữ liệu bảng chính
    const languageApi = await workflowService.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: 'BO_LOAD_LANGUAGE_APP',
        input: {
            request_channel: "MB",
            page_index: 1,
            page_size: 10,
            search: ""
        },
        language: locale,
    });

    const hasError =
        !isValidResponse(languageApi) ||
        ((languageApi?.payload?.dataresponse?.errors ?? []).length > 0);

    if (hasError) {
        const err0 = languageApi?.payload?.dataresponse?.errors?.[0];
        if (err0) {
            console.log('ExecutionID:', `${err0.execute_id} - ${err0.info}`);
        }
        return <Spinner />;
    }

    const languageData =
        (languageApi.payload.dataresponse.data.input as PageLanguageResponse<LanguageDataMobileType[]>) ?? {
            items: [],
            total: 0,
            pageindex: 1,
            pagesize: 10,
        };

    return (
        <LanguageManagementContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            languageData={languageData}
        />
    );
};

export default LanguageManagement;
