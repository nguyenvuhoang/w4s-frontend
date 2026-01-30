import { env } from '@/env.mjs';
import { BODataResponse, FODataResponse, RunBoDynamicDataRequest, RunDynamicDataRequest, RunFoDataRequest, RunFoDynamicDataRequest, SearchDataRequest, ViewDataResponse } from "@shared/types/systemTypes";
import { apiPost, createDefaultBody } from '../../lib/api';
import http from "../../lib/http";
import Cookies from 'js-cookie';

/**
 * Workflow Service
 * Handles BO (Business Object) and FO (Function Object) operations
 */
export const workflowService = {
    /**
     * Run Business Object (BO) operation
     * Validates commandname when issearch is true
     */
    runBO: ({ sessiontoken, learnapi, workflowid, commandname, pageSize, pageIndex, parameters, issearch }: SearchDataRequest) => {
        // Validate commandname to prevent empty calls (only when issearch is true and commandname is expected)
        if (issearch && (!commandname || commandname.trim() === '')) {
            console.warn('âš ï¸ runBO called with empty commandname for search operation, skipping API call');
            return Promise.resolve({
                status: 400,
                payload: {
                    dataresponse: {
                        error: [{ info: 'Command name is required for search operations', key: '400', code: 'VALIDATION_ERROR' }],
                        fo: []
                    }
                }
            } as any);
        }

        const selectedApp = Cookies.get('selected_app') || 'PORTAL';
        return http.post<BODataResponse>('/system-service',
            {
                bo: [
                    {
                        input: {
                            learn_api: learnapi,
                            workflowid: workflowid,
                            commandname: commandname,
                            pageindex: pageIndex,
                            pagesize: pageSize,
                            issearch: issearch,
                            parameters: parameters
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: selectedApp
                }
            })
    },

    /**
     * Run Function Object (FO) operation
     */
    runFO: ({ sessiontoken, learnapi, workflowid }: RunFoDataRequest) =>
        (() => {
            const selectedApp = Cookies.get('selected_app') || env.NEXT_PUBLIC_APPLICATION_CODE || 'BO';
            return http.post<FODataResponse>('/system-service',
                {
                    bo: [
                        {
                            use_microservice: true,
                            input: {
                                learn_api: learnapi,
                                workflowid: workflowid
                            }
                        }
                    ]
                },
                {
                    baseUrl: process.env.NEXT_PUBLIC_API_URL,
                    headers: {
                        uid: `${sessiontoken}`,
                        app: selectedApp
                    }
                })
        })(),

    /**
     * Run Function Object (FO) with dynamic input
     */
    runFODynamic: ({ sessiontoken, workflowid, input, language, encrypt }: RunFoDynamicDataRequest & { encrypt?: boolean }) =>
        apiPost<ViewDataResponse>('/system-service',
            createDefaultBody(
                workflowid as string,
                {
                    ...input,
                },
            ),
            sessiontoken as string,
            {
                lang: language ?? "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS'
            },
            { encrypt }
        ),

    /**
     * Run Business Object (BO) with dynamic transaction
     */
    runBODynamic: ({ sessiontoken, txFo, encrypt }: RunBoDynamicDataRequest & { encrypt?: boolean }) =>
        (() => {
            const selectedApp = Cookies.get('selected_app') || env.NEXT_PUBLIC_APPLICATION_CODE || 'BO';
            return http.post<FODataResponse>('/system-service',
                txFo,
                {
                    baseUrl: process.env.NEXT_PUBLIC_API_URL,
                    headers: {
                        uid: `${sessiontoken}`,
                        app: selectedApp
                    },
                    encrypt
                })
        })(),

    /**
     * Run dynamic workflow with custom body
     */
    runDynamic: ({ body, sessiontoken }: RunDynamicDataRequest) =>
        apiPost<ViewDataResponse>('/system-service',
            body,
            sessiontoken as string,
            { lang: "en", app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),
}

