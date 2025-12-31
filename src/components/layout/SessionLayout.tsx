import { auth } from '@/auth';
import { Locale } from '@/configs/i18n';
import { siteConfig } from '@/data/meta';
import { systemServiceApi } from '@/servers/system-service'; // Import API
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import { getServerMode } from '@/utils/serverHelpers';
import type { Mode } from '@core/types';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { JSX } from 'react';
import Spinner from '../spinners';

export const generateAuthMetadata = (pageName: string): Metadata => ({
    title: `${siteConfig.shortName} - ${pageName}`,
    description: `${siteConfig.description}`,
});

interface SessionLayoutProps {
    children: (props: {
        mode: Mode;
        dictionary: any;
        locale: Locale;
        session: Session | null;
        storename?: string;
        id?: string;
        dataview?: any;
    }) => JSX.Element;
    params: { locale: Locale; slug?: string[]; details?: string[] };
}

const SessionLayout = async ({ children, params }: SessionLayoutProps) => {
    const resolvedParams =  params;
    const mode = await getServerMode();

    const [dictionary, session] = await Promise.all([
        getDictionary(resolvedParams.locale),
        auth(),
    ]);

    let storename: string | undefined;
    let id: string | undefined;
    let viewdata: any;

    // Handle both slug and details parameters for backward compatibility
    const routeParams = resolvedParams.slug || resolvedParams.details;
    if (routeParams && Array.isArray(routeParams)) {
        storename = routeParams[routeParams.length - 2];
        id = routeParams[routeParams.length - 1];

        // Only make API call if storename and id are valid
        if (storename && id) {
            const dataviewAPI = await systemServiceApi.viewData({
                sessiontoken: session?.user?.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: 'SYS_EXECUTE_SQL',
                commandname: storename,
                issearch: false,
                parameters: { id: id },
            });

            if (
                !isValidResponse(dataviewAPI) ||
                (dataviewAPI.payload.dataresponse.error && dataviewAPI.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    dataviewAPI.payload.dataresponse.error[0].execute_id +
                    ' - ' +
                    dataviewAPI.payload.dataresponse.error[0].info
                );
                return <Spinner />;
            }

            viewdata = dataviewAPI.payload.dataresponse.fo[0].input.data[0];
        }
    }

    return children({
        mode,
        dictionary,
        locale: resolvedParams.locale,
        session,
        storename,
        id,
        dataview: viewdata,
    });
};

export default SessionLayout;
