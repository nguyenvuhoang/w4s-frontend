import { dataService } from '@/servers/system-service/services/data.service';
import { workflowService } from '@/servers/system-service/services/workflow.service';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { Locale } from '@/configs/i18n';
import { locale } from 'dayjs';
import { isValidResponse } from '@/shared/utils/isValidResponse';

export const fetchEmailSettings = async (token: string) => {
    try {
        const response = await dataService.searchSystemData({
            sessiontoken: token,
            workflowid: WORKFLOWCODE.WF_BO_SEARCH_MAIL_CONFIG,
            pageIndex: 0,
            pageSize: 10,
        });

        if (response.status === 200 && response.payload?.dataresponse?.data) {
            const data = response.payload.dataresponse.data as any;
            if (Array.isArray(data) && data.length > 0) {
                return { success: true, data: data[0] };
            }
        }
        return { success: false, error: 'No configuration found' };
    } catch (error) {
        console.error('emailService: fetchEmailSettings failed', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
};

export const sendEmail = async (token: string, data: { recipient: string, subject: string, content: string }, locale: Locale) => {
    // This is a placeholder for actual send logic
    // Usually involve workflowService.runBODynamic or similar
    console.log('emailService: sending email', data);
    return { success: true };
};

export const deleteEmails = async (token: string, ids: (string | number)[]) => {
    try {
        const response = await workflowService.runFODynamic({
            sessiontoken: token,
            workflowid: WORKFLOWCODE.WF_BO_MAIL_DELETE_SEND_OUT,
            input: {
                ids: ids
            }
        });

        if (isValidResponse(response)) {
            return { success: true };
        }
        return { success: false, error: 'Delete failed' };
    } catch (error) {
        console.error('emailService: deleteEmails failed', error);
        return { success: false, error: 'Failed to delete emails' };
    }
};

export const fetchEmailDetail = async (token: string, id: string | number) => {
    try {
        const response = await workflowService.runFODynamic({
            sessiontoken: token,
            workflowid: WORKFLOWCODE.WF_BO_RETRIEVE_MAIL_SEND_OUT,
            input: {
                id: id
            }
        });

        if (isValidResponse(response)) {
            return {
                success: true,
                data: response.payload?.dataresponse?.data?.items?.[0] ?? response.payload?.dataresponse?.data
            };
        }
        return { success: false, error: 'Failed to fetch email detail' };
    } catch (error) {
        console.error('emailService: fetchEmailDetail failed', error);
        return { success: false, error: 'Failed to fetch email detail' };
    }
};

export const setStarEmail = async (token: string, id: string | number) => {
    try {
        const response = await workflowService.runFODynamic({
            sessiontoken: token,
            workflowid: WORKFLOWCODE.WF_BO_SET_STAR_MAIL_SEND_OUT,
            input: {
                id: id
            }
        });

        if (isValidResponse(response)) {
            return { success: true };
        }
        return { success: false, error: 'Failed to star email' };
    } catch (error) {
        console.error('emailService: setStarEmail failed', error);
        return { success: false, error: 'Failed to star email' };
    }
};

export const setImportantEmail = async (token: string, id: string | number) => {
    try {
        const response = await workflowService.runFODynamic({
            sessiontoken: token,
            workflowid: WORKFLOWCODE.WF_BO_SET_IMPORTANT_MAIL_SEND_OUT,
            input: {
                id: id
            }
        });

        if (isValidResponse(response)) {
            return { success: true };
        }
        return { success: false, error: 'Failed to mark email as important' };
    } catch (error) {
        console.error('emailService: setImportantEmail failed', error);
        return { success: false, error: 'Failed to mark email as important' };
    }
};
