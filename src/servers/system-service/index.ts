import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { env } from '@/env.mjs';
import { BODataResponse, FODataArrayResponse, FODataResponse, FormDataResponse, ReportDataRequest, ReportDetailDataRequest, RunBoDynamicDataRequest, RunDynamicDataRequest, RunFoDataRequest, RunFoDynamicDataRequest, SearchDataRequest, SearchDataResponse, SystemDataRequest, SystemDataResponse, UpdateDataRequest, ViewDataRequest, ViewDataResponse } from "@/types/systemTypes";
import { apiPost, createDefaultBody } from '../lib/api';
import http from "../lib/http";

export const systemServiceApi = {

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
    getSystemInfo: ({ sessiontoken, language }: SystemDataRequest) =>
        apiPost<SystemDataResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.WF_BO_APP_INFO, {
                applicationcode: env.NEXT_PUBLIC_APPLICATION_CODE ?? ''
            }),
            sessiontoken,
            { lang: language, app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),

    updateTokenReal: ({ tokenreal }: { tokenreal: string }) =>
        http.post<{}>(`/updateTokenReal`,
            {
                tokenreal
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
            }
        ),
    getCdList: ({ sessiontoken, language, codegroup, codename }: { codegroup: string, codename: string } & SystemDataRequest) =>
        apiPost<FODataArrayResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.BO_GET_CDLIST_BY_CDGRP_CDNAME as string, {
                ...(codename ? { codename: codename } : {}),
                ...(codegroup ? { codegroup: codegroup } : {}),
            }),
            sessiontoken as string,
            { lang: language, app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),

    getCdListFromACT: ({ sessiontoken, language, codegroup, codename }: { codegroup: string, codename: string } & SystemDataRequest) =>
        apiPost<FODataArrayResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.BO_GET_CDLIST_BY_CDGRP_CDNAME_FROM_ACT as string, {
                ...(codename ? { codename: codename } : {}),
                ...(codegroup ? { codegroup: codegroup } : {}),
            }),
            sessiontoken as string,
            { lang: language, app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),

    searchData: ({ sessiontoken, workflowid, commandname, searchtext, pageSize, pageIndex, parameters, logtype, language }: SearchDataRequest) => {
        // Validate commandname to prevent empty calls
        if (!commandname || commandname.trim() === '') {
            console.warn('⚠️ searchData called with empty commandname, skipping API call');
            return Promise.resolve({
                status: 400,
                payload: {
                    dataresponse: {
                        errors: [{ info: 'Command name is required', key: '400', code: 'VALIDATION_ERROR' }],
                        data: {}
                    }
                }
            } as any);
        }

        return apiPost<SearchDataResponse>('/system-service',
            createDefaultBody(workflowid as string, {
                commandname: commandname,
                issearch: true,
                pageindex: pageIndex,
                pagesize: pageSize,
                parameters: {
                    searchtext: searchtext,
                    channel: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
                    language: language ?? 'en',
                    ...parameters
                },
                ...(logtype && { log_type: logtype })
            }),
            sessiontoken as string,
            {
                lang: "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            }
        )
    },

    searchSystemData: ({ sessiontoken, workflowid, searchtext, pageSize, pageIndex }: SearchDataRequest) =>
        apiPost<SearchDataResponse>('/system-service',
            createDefaultBody(workflowid as string, {
                search_text: searchtext,
                page_index: pageIndex,
                page_size: pageSize,
            }),
            sessiontoken as string,
            {
                lang: "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            }
        ),
    updateSystemData: ({ sessiontoken, workflowid, data }: UpdateDataRequest) =>
        apiPost<BODataResponse>('/system-service',
            createDefaultBody(workflowid as string, data),
            sessiontoken as string,
            {
                lang: "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            }
        ),
    viewData: ({ sessiontoken, workflowid, commandname, parameters }: ViewDataRequest) => {
        // Validate commandname to prevent empty calls
        if (!commandname || commandname.trim() === '') {
            console.warn('⚠️ viewData called with empty commandname, skipping API call');
            return Promise.resolve({
                status: 400,
                payload: {
                    dataresponse: {
                        error: [{ info: 'Command name is required', key: '400', code: 'VALIDATION_ERROR' }],
                        fo: []
                    }
                }
            } as any);
        }

        return apiPost<ViewDataResponse>('/system-service',
            createDefaultBody(workflowid as string, {
                applicationcode: env.NEXT_PUBLIC_APPLICATION_CODE ?? '',
                commandname: commandname,
                issearch: false,
                parameters: parameters
            }),
            sessiontoken as string,
            { lang: "en", app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        )
    },

    advanceSearchData: ({ sessiontoken, workflowid, commandname, advanccesearch, pageSize, pageIndex, language }: SearchDataRequest) => {
        // Validate commandname to prevent empty calls
        if (!commandname || commandname.trim() === '') {
            console.warn('⚠️ advanceSearchData called with empty commandname, skipping API call');
            return Promise.resolve({
                status: 400,
                payload: {
                    dataresponse: {
                        error: [{ info: 'Command name is required', key: '400', code: 'VALIDATION_ERROR' }],
                        fo: []
                    }
                }
            } as any);
        }

        return apiPost<SearchDataResponse>('/system-service',
            createDefaultBody(workflowid as string, {
                commandname: commandname,
                issearch: true,
                pageindex: pageIndex,
                pagesize: pageSize,
                parameters: {
                    channel: 'BO',
                    ...advanccesearch
                }
            }),
            sessiontoken as string,
            {
                lang: language ?? "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            }
        )
    },

    runBO: ({ sessiontoken, learnapi, workflowid, commandname, pageSize, pageIndex, parameters, issearch }: SearchDataRequest) => {
        // Validate commandname to prevent empty calls (only when issearch is true and commandname is expected)
        if (issearch && (!commandname || commandname.trim() === '')) {
            console.warn('⚠️ runBO called with empty commandname for search operation, skipping API call');
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
                    app: 'PORTAL'
                }
            })
    },

    runFO: ({ sessiontoken, learnapi, workflowid }: RunFoDataRequest) =>
        http.post<FODataResponse>('/system-service',
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
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),

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


    runBODynamic: ({ sessiontoken, txFo, encrypt }: RunBoDynamicDataRequest & { encrypt?: boolean }) =>
        http.post<FODataResponse>('/system-service',
            txFo,
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                },
                encrypt
            }),
    loadReport: ({ sessiontoken, pageindex, pagesize }: ReportDataRequest) =>
        http.post<FODataArrayResponse>('/system-service',
            {
                bo: [
                    {
                        use_microservice: true,
                        input: {
                            learn_api: "cbs_workflow_execute",
                            workflowid: "RPT_EXECUTE_SQL",
                            fields: {
                                command_name: "SimpleSearchReport",
                                is_search: true,
                                page_index: pageindex,
                                page_size: pagesize,
                                parameters: {
                                    searchtext: ''
                                }
                            }
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),
    loadReportDetail: ({ sessiontoken, pageindex, pagesize, reportid, langid }: ReportDetailDataRequest) =>
        http.post<FODataArrayResponse>('/system-service',
            {
                bo: [
                    {
                        input: {
                            learn_api: "cbs_workflow_execute",
                            workflowid: "RPT_EXECUTE_SQL",
                            commandname: "SimpleSearchReportDetail",
                            issearch: true,
                            pageindex: pageindex,
                            pagesize: pagesize,
                            parameters: {
                                searchtext: reportid,
                                langid: langid
                            }
                        }
                    }
                ]
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),

    runDynamic: ({ body, sessiontoken }: RunDynamicDataRequest) =>
        apiPost<ViewDataResponse>('/system-service',
            body,
            sessiontoken as string,
            { lang: "en", app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),
}
