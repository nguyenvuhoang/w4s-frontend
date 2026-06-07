import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Box } from '@mui/material';
import YarpConfigView from '@/components/api-manager/gateway/routes/YarpConfigView';
import { ReverseProxyConfig, ReverseProxyResponseData } from '@/types/yarp';
import { auth } from '@/auth';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import { Locale } from '@/configs/i18n';

export const dynamic = 'force-dynamic';

type ReverseProxyApiResponse = {
    payload?: {
        dataresponse?: {
            data?: ReverseProxyResponseData | null;
        };
    };
    dataresponse?: {
        data?: ReverseProxyResponseData | null;
    };
};

const extractReverseProxyConfig = (response: ReverseProxyApiResponse): ReverseProxyConfig => {
    const data = response.payload?.dataresponse?.data ?? response.dataresponse?.data;

    return {
        Routes: data?.ReverseProxy?.Routes ?? {},
        Clusters: data?.ReverseProxy?.Clusters ?? {}
    };
};

export default async function GatewaysRoutesPage({ params }: { params: { locale: string } }) {
    const session = await auth();
    const locale = params.locale as Locale;

    const res = await learnAPIService.getReverseProxyConfig({
        sessiontoken: session?.user?.token as string,
        language: locale
    });

    const reverseProxyConfig = extractReverseProxyConfig(res as ReverseProxyApiResponse);

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ px: 3, pt: 3 }}>
                <PageHeader
                    title="Reverse Proxy Configuration"
                    breadcrumbs={[
                        { label: 'Dashboard' },
                        { label: 'API Manager' },
                        { label: 'Reverse Proxy Configuration' }
                    ]}
                />
            </Box>
            <YarpConfigView
                config={reverseProxyConfig}
                locale={locale}
                sessionToken={session?.user?.token as string}
            />
        </Box>
    );
}
