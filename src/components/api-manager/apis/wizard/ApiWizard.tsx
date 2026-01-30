'use client';

import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Paper, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/server/api-manager/client';
import { useDictionary } from '@/lib/i18n';
import { ApiSpecUploadCard } from '@/components/api-manager/spec/ApiSpecUploadCard';
import { DraftStatusPanel } from '@/components/api-manager/spec/DraftStatusPanel';
import { EndpointPreviewTable } from '@/components/api-manager/spec/EndpointPreviewTable';
import { OpenApiEditor } from '@/components/api-manager/spec/OpenApiEditor';

const steps = ['Source', 'Draft & OpenAPI', 'Basic Info', 'Review'];

export default function ApiWizard() {
    const router = useRouter();
    const { t } = useDictionary();
    const [activeStep, setActiveStep] = useState(0);
    const [source, setSource] = useState<'manual' | 'pdf'>('manual');

    // Draft State
    const [draft, setDraft] = useState<any>(null);
    const [openApiSpec, setOpenApiSpec] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        version: 'v1.0.0',
        description: '',
        type: 'rest',
        contextPath: '/api/v1',
    });

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            await handleSubmit();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            if (source === 'pdf' && draft) {
                // Create from Draft
                await fetch(`/api/api-manager/spec/drafts/${draft.id}/create-api`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        version: formData.version,
                        context: formData.contextPath
                    })
                });
            } else {
                // Manual Create
                await apiClient.post('/apis', { ...formData, endpoints: [] });
            }
            router.push('/api-manager/apis');
        } catch (err) {
            alert('Failed to create API');
        }
    };

    const handleGenerateOpenApi = async () => {
        if (!draft) return;
        const res = await fetch(`/api/api-manager/spec/drafts/${draft.id}/generate-openapi`, { method: 'POST' });
        const data = await res.json();
        setOpenApiSpec(data.openApiSpec);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title={t('api.create')} breadcrumbs={[{ label: t('api.list'), href: '/api-manager/apis' }, { label: t('api.create') }]} />

            <Paper sx={{ p: 3, mt: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ minHeight: 300 }}>
                    {/* Step 1: Source Selection */}
                    {activeStep === 0 && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>{t('api.spec.source')}</Typography>
                            <ToggleButtonGroup
                                value={source}
                                exclusive
                                onChange={(e, val) => val && setSource(val)}
                                sx={{ mb: 4 }}
                            >
                                <ToggleButton value="manual">Manual Definition</ToggleButton>
                                <ToggleButton value="pdf">Import from PDF Specification</ToggleButton>
                            </ToggleButtonGroup>

                            {source === 'pdf' && (
                                <ApiSpecUploadCard onUploadComplete={(d) => {
                                    setDraft(d);
                                    setFormData(prev => ({
                                        ...prev,
                                        name: d.title,
                                        description: `Imported from ${d.fileName}`
                                    }));
                                }} />
                            )}

                            {draft && source === 'pdf' && (
                                <DraftStatusPanel status={draft.status} fileName={draft.fileName} />
                            )}
                        </Box>
                    )}

                    {/* Step 2: Draft & OpenAPI */}
                    {activeStep === 1 && (
                        <Box>
                            {source === 'pdf' ? (
                                <>
                                    <Typography variant="h6">{t('api.spec.draft_title')}</Typography>
                                    <EndpointPreviewTable endpoints={draft?.extractedJson?.endpoints || []} />

                                    <Box sx={{ mt: 3 }}>
                                        <Button variant="outlined" onClick={handleGenerateOpenApi} disabled={!draft || !!openApiSpec}>
                                            {t('api.spec.generate_openapi')}
                                        </Button>
                                    </Box>

                                    {openApiSpec && (
                                        <OpenApiEditor
                                            value={openApiSpec}
                                            onChange={setOpenApiSpec}
                                            onValidate={() => alert('Valid (Mock)')}
                                        />
                                    )}
                                </>
                            ) : (
                                <Typography>Manual definition of endpoints (Skipped for demo)</Typography>
                            )}
                        </Box>
                    )}

                    {/* Step 3: Basic Info */}
                    {activeStep === 2 && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth label="API Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth label="Version" value={formData.version} onChange={e => handleChange('version', e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select value={formData.type} label="Type" onChange={e => handleChange('type', e.target.value)}>
                                        <MenuItem value="rest">REST</MenuItem>
                                        <MenuItem value="graphql">GraphQL</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth multiline rows={3} label="Description" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                            </Grid>
                        </Grid>
                    )}

                    {/* Step 4: Review */}
                    {activeStep === 3 && (
                        <Box>
                            <Typography variant="h6">Review & Create</Typography>
                            <Typography><strong>Name:</strong> {formData.name}</Typography>
                            <Typography><strong>Version:</strong> {formData.version}</Typography>
                            <Typography><strong>Source:</strong> {source === 'pdf' ? 'PDF Import' : 'Manual'}</Typography>
                            {draft && <Typography><strong>Endpoints Found:</strong> {draft.extractedJson?.endpoints?.length || 0}</Typography>}
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                    <Button disabled={activeStep === 0} onClick={handleBack}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={handleNext} disabled={activeStep === 0 && source === 'pdf' && !draft}>
                        {activeStep === steps.length - 1 ? t('common.create') : 'Next'}
                    </Button>
                </Box>
            </Paper >
        </Box >
    );
}
