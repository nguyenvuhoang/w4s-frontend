'use client';

import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Locale } from '@/configs/i18n';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import { LearnAPIType } from '@/shared/types';
import { getDictionary } from '@/shared/utils/getDictionary';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import SwalAlert from '@/shared/utils/SwalAlert';
import { ArrowBack, Save } from '@mui/icons-material';
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
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';

const JsonEditor = dynamic(
    () => import('jsoneditor-react').then((mod) => mod.JsonEditor),
    { ssr: false }
);
import 'jsoneditor-react/es/editor.min.css';

interface LearnApiAddProps {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    locale: Locale;
    session: Session | null;
}

export default function LearnApiAdd({ dictionary, locale, session }: LearnApiAddProps) {
    const router = useRouter();
    const dict = dictionary['common'] || ({} as any);

    const { control, handleSubmit, formState: { isSubmitting, isValid } } = useForm<LearnAPIType>({
        defaultValues: {
            learn_api_id: '',
            learn_api_name: '',
            uri: '',
            learn_api_method: 'GET',
            channel: 'BO',
            learn_api_mapping: '{}',
            learn_api_mapping_response: '{}'
        }
    });

    const onSubmit = async (data: LearnAPIType) => {
        try {
            const res = await learnAPIService.create({
                sessiontoken: session?.user?.token as string,
                language: locale,
                data
            });

            if (isValidResponse(res) && !res.payload.dataresponse.errors?.length) {
                SwalAlert('success', 'Create successful', 'center');
                router.push(`/${locale}/api-manager/apis`);
            } else {
                const error = res.payload.dataresponse.errors?.[0]?.info || 'Create failed';
                const executionId = res.payload.dataresponse.errors?.[0]?.execute_id;
                SwalAlert('error', `Error: ${error}${executionId ? ` (ID: ${executionId})` : ''}`, 'center');
            }
        } catch (error) {
            console.error('Create error:', error);
            SwalAlert('error', 'An unexpected error occurred during creation.', 'center');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Add New Learn API"
                breadcrumbs={[
                    { label: 'APIs', href: `/${locale}/api-manager/apis` },
                    { label: 'Add New' }
                ]}
                action={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => router.back()}
                    >
                        {dict.back || 'Back'}
                    </Button>
                }
            />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }} >
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="learn_api_id"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="API ID" required />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="learn_api_name"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="API Name" required />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="uri"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="URI" required />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="learn_api_method"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} value={field.value ?? ''} fullWidth label="Method" select required>
                                                    <MenuItem value="GET">GET</MenuItem>
                                                    <MenuItem value="POST">POST</MenuItem>
                                                    <MenuItem value="PUT">PUT</MenuItem>
                                                    <MenuItem value="DELETE">DELETE</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
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

                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Save />}
                                        disabled={!isValid || isSubmitting}
                                        loading={isSubmitting}
                                    >
                                        {isSubmitting ? 'Creating...' : (dict.save || 'Create API')}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </form>
                </Grid>
            </Grid>
        </Box>
    );
}
