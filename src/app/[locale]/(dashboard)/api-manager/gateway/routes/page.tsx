import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Box } from '@mui/material';
import YarpConfigView from '@/components/api-manager/gateway/routes/YarpConfigView';
import { YarpRoute, YarpCluster } from '@/types/yarp';
import { auth } from '@/auth';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import { Locale } from '@/configs/i18n';

export default async function GatewaysRoutesPage({ params }: { params: { locale: string } }) {
    const session = await auth();
    const locale = params.locale as Locale;

    const res = await learnAPIService.getReverseProxyConfig({
        sessiontoken: session?.user?.token as string,
        language: locale
    });

    const data = res.payload.dataresponse.data as any;

    const routes: YarpRoute[] = Object.entries(data?.ReverseProxy?.Routes || {}).map(([id, config]: [string, any]) => ({
        id,
        ...config
    })) as YarpRoute[];

    const clusters: YarpCluster[] = Object.entries(data?.ReverseProxy?.Clusters || {}).map(([id, config]: [string, any]) => ({
        id,
        ...config
    })) as YarpCluster[];

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ px: 3, pt: 3 }}>
                <PageHeader
                    title="Gateway Proxy Configuration"
                    breadcrumbs={[
                        { label: 'Dashboard' },
                        { label: 'API Manager' },
                        { label: 'Gateway Proxy' }
                    ]}
                />
            </Box>
            <YarpConfigView initialRoutes={routes} initialClusters={clusters} />
        </Box>
    );
}
