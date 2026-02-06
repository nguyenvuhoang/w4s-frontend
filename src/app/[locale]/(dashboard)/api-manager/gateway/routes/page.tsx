import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Box } from '@mui/material';
import YarpConfigView from '@/components/api-manager/gateway/routes/YarpConfigView';
import { YarpRoute, YarpCluster } from '@/types/yarp';

const SAMPLE_YARP_DATA = {
    "ReverseProxy": {
        "Routes": {
            "chat-sse": {
                "ClusterId": "AIService",
                "Match": {
                    "Path": "/api/chat"
                }
            },
            "w4s-upload": {
                "ClusterId": "W4SService",
                "Match": {
                    "Path": "/api/w4s/{**catch-all}"
                },
                "Transforms": [
                    { "PathRemovePrefix": "/api/w4s" }
                ]
            }
        },
        "Clusters": {
            "AIService": {
                "Destinations": {
                    "primary": {
                        "Address": "https://192.168.1.103:5050"
                    }
                },
                "HttpRequest": {
                    "ActivityTimeout": "00:10:00",
                    "Version": "1.1",
                    "VersionPolicy": "RequestVersionExact",
                    "AllowResponseBuffering": false
                }
            },
            "W4SService": {
                "Destinations": {
                    "primary": {
                        "Address": "https://localhost:5020"
                    }
                },
                "HttpRequest": {
                    "ActivityTimeout": "00:10:00",
                    "Version": "1.1",
                    "VersionPolicy": "RequestVersionExact",
                    "AllowResponseBuffering": false
                }
            }
        }
    }
};

export default function GatewaysRoutesPage() {
    const routes: YarpRoute[] = Object.entries(SAMPLE_YARP_DATA.ReverseProxy.Routes).map(([id, config]) => ({
        id,
        ...config
    })) as YarpRoute[];

    const clusters: YarpCluster[] = Object.entries(SAMPLE_YARP_DATA.ReverseProxy.Clusters).map(([id, config]) => ({
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
