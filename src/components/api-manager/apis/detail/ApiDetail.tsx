'use client';

import PageHeader from '@/components/api-manager/shared/PageHeader';
import { ApiSpecUploadCard } from '@/components/api-manager/spec/ApiSpecUploadCard';
import { DraftStatusPanel } from '@/components/api-manager/spec/DraftStatusPanel';
import { EndpointPreviewTable } from '@/components/api-manager/spec/EndpointPreviewTable';
import { OpenApiEditor } from '@/components/api-manager/spec/OpenApiEditor';
import { useDictionary } from '@/lib/i18n';
import { Api } from '@/types/api-manager';
import { CloudUpload, Description, Edit } from '@mui/icons-material';
import { Box, Button, Divider, Grid, Paper, Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';

interface ApiDetailProps {
    api: Api;
}

export default function ApiDetail({ api }: ApiDetailProps) {
    const [tab, setTab] = useState(0);

    // Spec Tab State (Demo)
    const [draft, setDraft] = useState<any>(null);
    const [openApiSpec, setOpenApiSpec] = useState('');

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleGenerateOpenApi = async () => {
        if (!draft) return;
        const res = await fetch(`/api/api-manager/spec/drafts/${draft.id}/generate-openapi`, { method: 'POST' });
        const data = await res.json();
        setOpenApiSpec(data.openApiSpec);
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title={api.name}
                breadcrumbs={[{ label: 'APIs', href: '/api-manager/apis' }, { label: api.name }]}
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" startIcon={<Edit />}>Edit</Button>
                        <Button variant="contained" startIcon={<CloudUpload />}>Deploy</Button>
                    </Box>
                }
            />

            <Paper sx={{ width: '100%' }}>
                <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab label="Overview" />
                    <Tab label="Versions" />
                    <Tab label="Endpoints" />
                    <Tab label="Policies" />
                    <Tab label="Analytics" />
                    <Tab label="Logs" />
                    <Tab label="Spec" icon={<Description />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {tab === 0 && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                <Typography paragraph>{api.description || 'No description provided.'}</Typography>

                                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Context Path</Typography>
                                <Typography>/api/{api.version}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary">Details</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                        <Typography>ID</Typography>
                                        <Typography variant="body2" color="text.secondary">{api.id}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                        <Typography>Current Version</Typography>
                                        <Typography variant="body2">{api.version}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                        <Typography>Type</Typography>
                                        <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>{api.type}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                    {tab === 1 && <Typography>Versions Management Mock</Typography>}
                    {tab === 2 && <Typography>Endpoints List Mock</Typography>}
                    {tab === 3 && <Typography>Policies Attachments Mock</Typography>}
                    {tab === 4 && <Typography>Analytics Charts Mock</Typography>}
                    {tab === 5 && <Typography>Traffic Logs Mock</Typography>}

                    {/* Spec Tab */}
                    {tab === 6 && (
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="h6" gutterBottom>Documentation Source</Typography>
                                <ApiSpecUploadCard onUploadComplete={(d) => setDraft(d)} />
                                {draft && <DraftStatusPanel status={draft.status} fileName={draft.fileName} />}

                                {draft?.extractedJson && (
                                    <Box sx={{ mt: 2 }}>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle2" gutterBottom>Draft Actions</Typography>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleGenerateOpenApi}
                                            disabled={!!openApiSpec}
                                        >
                                            Generate OpenAPI
                                        </Button>
                                    </Box>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Typography variant="h6" gutterBottom>Spec Draft</Typography>
                                {draft?.extractedJson?.endpoints ? (
                                    <>
                                        <Typography variant="subtitle2">Extracted Endpoints</Typography>
                                        <EndpointPreviewTable endpoints={draft.extractedJson.endpoints} />
                                    </>
                                ) : (
                                    <Typography color="text.secondary" variant="body2">
                                        Upload a PDF to see extracted endpoints.
                                    </Typography>
                                )}

                                {openApiSpec && (
                                    <Box sx={{ mt: 4 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <OpenApiEditor
                                            value={openApiSpec}
                                            onChange={setOpenApiSpec}
                                            onValidate={() => alert('Valid (Mock)')}
                                        />
                                        <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                                            Save as New Version
                                        </Button>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
