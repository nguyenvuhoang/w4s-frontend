import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { env } from '@/env.mjs';
import { FormDataResponse, SystemDataListResponse, SystemDataRequest, SystemDataResponse } from "@shared/types/systemTypes";
import { apiPost, createDefaultBody } from '../../lib/api';
import http from "../../lib/http";

/**
 * Form Service
 * Handles form information loading and system info operations
 */
export const formService = {
    /**
     * Load form information by form ID
     */
    loadFormInfo: ({ sessiontoken, language, formid }: SystemDataRequest) =>
        http.post<FormDataResponse>('/system-service',
            {
                learn_api: "CMS_LOAD_FORM",
                fields: {
                    formid: formid,
                    applicationcode: "PORTAL",
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),

    /**
     * Get system information
     */
    getSystemInfo: ({ sessiontoken, language }: SystemDataRequest) =>
        apiPost<SystemDataResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.WF_BO_APP_INFO, {
                applicationcode: env.NEXT_PUBLIC_APPLICATION_CODE ?? ''
            }),
            sessiontoken,
            {
                lang: language,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS'
            }
        ),

    /**
     * Update token real
     */
    updateTokenReal: ({ tokenreal }: { tokenreal: string }) =>
        http.post<{}>(`/updateTokenReal`,
            {
                tokenreal
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
            }
        ),

    getMenuInfo: ({ sessiontoken, language, application }: SystemDataRequest) =>
        apiPost<SystemDataListResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.WF_BO_LOAD_MENU, {
                channel_id: application ?? env.NEXT_PUBLIC_APPLICATION_CODE ?? ''
            }),
            sessiontoken,
            {
                lang: language,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS'
            }
        ),

}

