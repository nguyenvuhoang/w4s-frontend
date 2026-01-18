'use client';

import { dataService, systemServiceApi } from '@/servers/system-service';
import { MailTemplate } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import SwalAlert from '@/utils/SwalAlert';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { Session } from 'next-auth';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import EmailConfigTab from './email-setting/EmailConfigTab';
import EmailTemplateTab from './email-setting/EmailTemplateTab';

const EmailSetting = ({ session, dictionary }: {
    session: Session | null,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [rowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            id: '',
            config_id: '',
            smtpServer: '',
            smtpPort: '',
            senderEmail: '',
            email_test: '',
            password: '',
            timeout: '',
            useTLS: false,
        }
    });

    const [templates, setTemplates] = useState<MailTemplate[]>([]);

    const handleTabChange = (_: SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleSave = async (data: any) => {
        setSaving(true);

        try {
            const updateAPI = await dataService.updateSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_UPDATE_MAIL_CONFIG',
                data: {
                    id: data.id,
                    config_id: data.config_id,
                    host: data.smtpServer,
                    port: data.smtpPort,
                    sender: data.senderEmail,
                    email_test: data.email_test,
                    password: data.password,
                    enable_tls: data.useTLS
                }
            });

            if (
                !isValidResponse(updateAPI) ||
                (updateAPI.payload.dataresponse.errors && updateAPI.payload.dataresponse.errors.length > 0)
            ) {
                const { execute_id, info } = updateAPI.payload.dataresponse.errors[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                return;
            }
            SwalAlert('success', 'Update successful!', 'center');
        } catch (err) {
            console.error('Failed to update mail config', err);
            SwalAlert('error', 'Unexpected error occurred.', 'center');
        } finally {
            setSaving(false);
        }
    };


    const handleTestConnection = async (data: any) => {
        setTesting(true);
        try {
            const response = await dataService.updateSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_SEND_TEST_MAIL',
                data: {
                    host: data.smtpServer,
                    port: data.smtpPort,
                    sender: data.senderEmail,
                    email_test: data.email_test,
                    password: data.password,
                    enable_tls: data.useTLS
                }
            });

            if (
                !isValidResponse(response) ||
                (response.payload.dataresponse.errors && response.payload.dataresponse.errors.length > 0)
            ) {
                const { execute_id, info } = response.payload.dataresponse.errors[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                return;
            }

            const isvalid = response.payload.dataresponse.data.input.data;

            if (isvalid === false) {
                SwalAlert('error', 'Test mail failed. Please check your settings.', 'center');
                return;
            }


            SwalAlert('success', 'Test mail sent successfully!', 'center');
        } catch (err) {
            console.error('Failed to send test mail', err);
            SwalAlert('error', 'Unexpected error occurred while sending test mail.', 'center');
        } finally {
            setTesting(false);
        }
    };


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchEmailSettings = useCallback(async (pageIndex = 0) => {
        setLoading(true);
        try {
            const dataSearchAPI = await dataService.searchSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `BO_SEARCH_MAIL_CONFIG`,
                searchtext: '',
                pageSize: rowsPerPage,
                pageIndex
            });

            if (!isValidResponse(dataSearchAPI) ||
                (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)) {
                const { execute_id, info } = dataSearchAPI.payload.dataresponse.errors[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                reset();
                return;
            }

            const dataSystem = dataSearchAPI.payload.dataresponse.data.input;
            const firstItem = dataSystem.items?.[0];
            if (firstItem) {
                reset({
                    id: firstItem.id || 0,
                    config_id: firstItem.config_id || '',
                    smtpServer: firstItem.host || '',
                    smtpPort: firstItem.port || 587,
                    senderEmail: firstItem.sender || '',
                    email_test: firstItem.email_test || '',
                    password: firstItem.password || '',
                    useTLS: firstItem.enable_tls || false,
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            reset();
        } finally {
            setLoading(false);
        }
    }, [reset, rowsPerPage, session?.user?.token]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchEmailTemplates = useCallback(async () => {
        setTemplateLoading(true);
        try {
            const templateResult = await systemServiceApi.searchSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `BO_SEARCH_MAIL_TEMPLATE`,
                searchtext: '',
                pageSize: 100,
                pageIndex: 0
            });

            if (!isValidResponse(templateResult) ||
                (templateResult.payload.dataresponse.errors && templateResult.payload.dataresponse.errors.length > 0)) {
                const { execute_id, info } = templateResult.payload.dataresponse.errors[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                reset();
                return;
            }

            const input = templateResult.payload.dataresponse.data.input;
            setTemplates(input.items || []);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setTemplates([]);
        } finally {
            setTemplateLoading(false);
        }
    }, [reset, session?.user?.token]);

    useEffect(() => {
        if (tab === 0) fetchEmailSettings(page);
        if (tab === 1) fetchEmailTemplates();
    }, [tab, page, fetchEmailSettings, fetchEmailTemplates]);

    return (
        <Box className="p-4">
            <Paper elevation={3} className="p-6 max-w mx-auto">
                <Typography variant="h5" className="mb-4 text-[#225087]">
                    {dictionary['email'].title}
                </Typography>

                <Tabs value={tab} onChange={handleTabChange} className="mb-6">
                    <Tab label={dictionary['email'].emailconfig} />
                    <Tab label={dictionary['email'].emailtemplate} />
                </Tabs>

                {tab === 0 && (
                    <EmailConfigTab
                        loading={loading}
                        control={control}
                        handleSubmit={handleSubmit}
                        dictionary={dictionary}
                        handleSave={handleSave}
                        handleTestConnection={handleTestConnection}
                        saving={saving}
                        testing={testing}
                    />
                )}

                {tab === 1 && (
                    <EmailTemplateTab
                        dictionary={dictionary}
                        templates={templates}
                        loading={templateLoading}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default EmailSetting;
