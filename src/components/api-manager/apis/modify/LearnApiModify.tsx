'use client';

import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Locale } from '@/configs/i18n';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import { LearnAPIType } from '@/shared/types';
import { getDictionary } from '@/shared/utils/getDictionary';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import SwalAlert from '@/shared/utils/SwalAlert';
import { ArrowBack, Save, SettingsSuggest } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Grid,
    MenuItem,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';

const JsonEditor = dynamic(
    () => import('jsoneditor-react').then((mod) => mod.JsonEditor),
    { ssr: false }
);
import 'jsoneditor-react/es/editor.min.css';

interface LearnApiModifyProps {
    api: LearnAPIType;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale: Locale;
}

export default function LearnApiModify({ api, dictionary, session, locale }: LearnApiModifyProps) {
    const router = useRouter();
    const dict = dictionary['common'] || ({} as any);

    const { control, handleSubmit, formState: { isDirty, isSubmitting } } = useForm<LearnAPIType>({
        defaultValues: api
    });

    const onSubmit = async (data: LearnAPIType) => {
        try {
            const res = await learnAPIService.update({
                sessiontoken: session?.user?.token as string,
                language: locale,
                data
            });

            if (isValidResponse(res) && !res.payload.dataresponse.errors?.length) {
                SwalAlert('success', 'Update successful');
                router.back();
            } else {
                const error = res.payload.dataresponse.errors?.[0]?.info || 'Update failed';
                const executionId = res.payload.dataresponse.errors?.[0]?.execute_id;
                SwalAlert('error', `Error: ${error}${executionId ? ` (ID: ${executionId})` : ''}`);
            }
        } catch (error) {
            console.error('Update error:', error);
            SwalAlert('error', 'An unexpected error occurred during update.');
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{
                p: 3,
                mb: 3,
                background: 'linear-gradient(90deg, #F8FAF9 0%, #FFFFFF 100%)',
                borderBottom: '1px solid #E0E0E0',
                borderRadius: '8px 8px 0 0'
            }}>
                <PageHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <SettingsSuggest sx={{ fontSize: 40, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                                    Modify API
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {api.learn_api_name}
                                </Typography>
                            </Box>
                        </Box>
                    }
                    breadcrumbs={[
                        { label: 'APIs', href: `/${locale}/api-manager/apis` },
                        { label: api.learn_api_name, href: `/${locale}/api-manager/apis/${api.learn_api_id}` },
                        { label: 'Modify' }
                    ]}
                    action={
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<ArrowBack />}
                            onClick={() => router.back()}
                            sx={{
                                borderRadius: 2,
                                borderColor: '#E0E0E0',
                                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(12, 145, 80, 0.04)' }
                            }}
                        >
                            {dict.back || 'Back'}
                        </Button>
                    }
                />
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>

                <Box sx={{ mt: 3 }}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="learn_api_id"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="API ID" disabled />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="learn_api_name"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="API Name" required />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="uri"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="URI" required />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <Controller
                                            name="channel"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="Channel" select required>
                                                    <MenuItem value="BO">BO</MenuItem>
                                                    <MenuItem value="FO">FO</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Configuration</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Request Mapping (JSON)</Typography>
                                        <Controller
                                            name="learn_api_mapping"
                                            control={control}
                                            render={({ field }) => (
                                                <Paper variant="outlined" sx={{ p: 0, '& .jsoneditor': { border: 'none' } }}>
                                                    <JsonEditor
                                                        value={field.value ? JSON.parse(field.value) : {}}
                                                        onChange={(val: any) => field.onChange(JSON.stringify(val))}
                                                        mode="code"
                                                        allowedModes={['code', 'tree', 'form']}
                                                        navigationBar={false}
                                                        statusBar={false}
                                                    />
                                                </Paper>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Response Mapping (JSON)</Typography>
                                        <Controller
                                            name="learn_api_mapping_response"
                                            control={control}
                                            render={({ field }) => (
                                                <Paper variant="outlined" sx={{ p: 0, '& .jsoneditor': { border: 'none' } }}>
                                                    <JsonEditor
                                                        value={field.value ? JSON.parse(field.value) : {}}
                                                        onChange={(val: any) => field.onChange(JSON.stringify(val))}
                                                        mode="code"
                                                        allowedModes={['code', 'tree', 'form']}
                                                        navigationBar={false}
                                                        statusBar={false}
                                                    />
                                                </Paper>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Save />}
                                        disabled={!isDirty || isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving...' : (dict.save || 'Save Changes')}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </form>
                </Box>
            </Box>
        </Box>
    );
}
