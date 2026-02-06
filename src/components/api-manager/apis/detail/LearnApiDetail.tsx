'use client';

import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Locale } from '@/configs/i18n';
import { LearnAPIType } from '@/shared/types';
import { getDictionary } from '@/shared/utils/getDictionary';
import { ArrowBack, Edit } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const JsonEditor = dynamic(
    () => import('jsoneditor-react').then((mod) => mod.JsonEditor),
    { ssr: false }
);
import 'jsoneditor-react/es/editor.min.css';

interface LearnApiDetailProps {
    api: LearnAPIType;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    locale: Locale;
}

export default function LearnApiDetail({ api, dictionary, locale }: LearnApiDetailProps) {
    const router = useRouter();
    const dict = dictionary['common'] || ({} as any);

    const getMethodColor = (method: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
        switch (method?.toUpperCase()) {
            case 'GET': return 'success'
            case 'POST': return 'info'
            case 'PUT': return 'warning'
            case 'DELETE': return 'error'
            default: return 'default'
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title={api.learn_api_name}
                breadcrumbs={[
                    { label: 'APIs', href: `/${locale}/api-manager/apis` },
                    { label: api.learn_api_name }
                ]}
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={() => router.push(`/${locale}/api-manager/apis`)}
                        >
                            {dict.back || 'Back List'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => router.push(`/${locale}/api-manager/apis/modify/${api.learn_api_id}`)}
                        >
                            {dict.modify || 'Edit'}
                        </Button>
                    </Box>
                }
            />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" gutterBottom>API Information</Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">ID</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{api.learn_api_id}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                    <Typography variant="body1">{api.learn_api_name}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" color="text.secondary">URI</Typography>
                                    <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
                                        {api.uri}
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Method</Typography>
                                    <Chip
                                        label={api.learn_api_method}
                                        size="small"
                                        color={getMethodColor(api.learn_api_method)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Channel</Typography>
                                    <Chip label={api.channel} size="small" variant="outlined" />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Internal</Typography>
                                    <Typography variant="body2">{api.is_internal ? 'Yes' : 'No'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Cache</Typography>
                                    <Typography variant="body2">{api.is_cache ? 'Yes' : 'No'}</Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Configuration</Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>API Data</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', whiteSpace: 'pre-wrap' }}>
                                    {api.learn_api_data || 'None'}
                                </Paper>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Headers</Typography>
                                <Paper variant="outlined" sx={{ p: 1, bgcolor: '#fafafa', '& .jsoneditor': { border: 'none' } }}>
                                    <JsonEditor
                                        value={api.learn_api_header ? JSON.parse(api.learn_api_header) : {}}
                                        mode="view"
                                        allowedModes={['view', 'tree', 'code']}
                                        navigationBar={false}
                                        statusBar={false}
                                    />
                                </Paper>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Request Mapping</Typography>
                                <Paper variant="outlined" sx={{ p: 1, bgcolor: '#fafafa', '& .jsoneditor': { border: 'none' } }}>
                                    <JsonEditor
                                        value={api.learn_api_mapping ? JSON.parse(api.learn_api_mapping) : {}}
                                        mode="view"
                                        allowedModes={['view', 'tree', 'code']}
                                        navigationBar={false}
                                        statusBar={false}
                                    />
                                </Paper>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Response Mapping</Typography>
                                <Paper variant="outlined" sx={{ p: 1, bgcolor: '#fafafa', '& .jsoneditor': { border: 'none' } }}>
                                    <JsonEditor
                                        value={api.learn_api_mapping_response ? JSON.parse(api.learn_api_mapping_response) : {}}
                                        mode="view"
                                        allowedModes={['view', 'tree', 'code']}
                                        navigationBar={false}
                                        statusBar={false}
                                    />
                                </Paper>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Other Details</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Interface Name</Typography>
                                    <Typography variant="body2">{api.full_interface_name || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Method Name</Typography>
                                    <Typography variant="body2">{api.method_name || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Node Data</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{api.learn_api_node_data || '-'}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
