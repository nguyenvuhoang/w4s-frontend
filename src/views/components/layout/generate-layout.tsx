import { auth } from '@/auth';
import PageError from '@/components/PageError';
import { Locale } from '@/configs/i18n';
import { siteConfig } from '@/data/meta';
import { systemServiceApi } from '@/servers/system-service';
import { FormInputData } from '@/types';
import { applyViewDataToForm } from '@/utils/applyViewDataToForm';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import { replaceParameterPlaceholders } from '@/utils/replaceParameterPlaceholders';
import { getServerMode } from '@/utils/serverHelpers';
import type { Mode } from '@core/types';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { JSX } from 'react';

export const generateAuthMetadata = (pageName: string): Metadata => ({
    title: `${siteConfig.shortName} - ${pageName}`,
    description: `${siteConfig.description}`,
});

interface SessionLayoutProps {
    children: (props: {
        mode: Mode;
        dictionary: Awaited<ReturnType<typeof getDictionary>>;
        locale: Locale;
        session: Session | null;
        formcode?: string;
        pageid?: string;
        id?: string;
        dataview?: any;
        formdata?: FormInputData;
    }) => JSX.Element;
    params: Promise<{ locale: Locale; slug?: string[] }>;
}

const GenerateLayout = async ({ children, params }: SessionLayoutProps) => {
    const resolvedParams = await params;
    const mode = await getServerMode();

    const [dictionary, session] = await Promise.all([
        getDictionary(resolvedParams.locale),
        auth(),
    ]);

    let id: string | undefined;
    let pageid: string | undefined;
    let viewdata: any;
    let formcode: string | undefined;
    let formdata: FormInputData | undefined;

    if (resolvedParams.slug && Array.isArray(resolvedParams.slug)) {
        const slug = resolvedParams.slug;
        id = slug[slug.length - 1];
        pageid = slug[slug.length - 2];

        formcode = pageid.replace(/-/g, '_');

        const pagecontentApi = await systemServiceApi.loadFormInfo({
            sessiontoken: session?.user?.token as string,
            language: resolvedParams.locale,
            formid: formcode
        })

        if (
            !isValidResponse(pagecontentApi) ||
            (pagecontentApi.payload.dataresponse.errors && pagecontentApi.payload.dataresponse.errors.length > 0)
        ) {
            const errorString = 'ExecutionID:' + pagecontentApi.payload.dataresponse.errors[0].execute_id + ' - ' + pagecontentApi.payload.dataresponse.errors[0].info
            return <PageError errorDetails={errorString} />
        }
        formdata = pagecontentApi.payload.dataresponse.data as unknown as FormInputData;

        const masterdata = formdata.form_design_detail.master_data;

        const resolvedMasterData = replaceParameterPlaceholders(masterdata, id ?? '', dictionary, resolvedParams.locale);
        
        const viewdataApi = await systemServiceApi.runDynamic({
            sessiontoken: session?.user?.token as string,
            body: resolvedMasterData,
        })

        if (
            !isValidResponse(viewdataApi) ||
            (viewdataApi.payload.dataresponse.errors && viewdataApi.payload.dataresponse.errors.length > 0)
        ) {
            const errorString =
                'ExecutionID:' + viewdataApi.payload.dataresponse.errors[0].execute_id + ' - ' + viewdataApi.payload.dataresponse.errors[0].info
            return <PageError errorDetails={errorString} />
        }

        viewdata = viewdataApi.payload.dataresponse.data;
        applyViewDataToForm(formdata, viewdata);

    }

    return children({
        mode,
        dictionary,
        locale: resolvedParams.locale,
        session,
        formcode,
        id,
        dataview: viewdata,
        formdata: formdata
    });
};

export default GenerateLayout;
