import { LEARNAPICODE } from '@/data/LearnAPICode';
import { env } from '@/env.mjs';
import { BODataResponse, LearnAPIType, SearchDataResponse, SystemSearchDataRequest, WorkflowLogDetailData } from "@shared/types/systemTypes";
import http from "../../lib/http";

/**
 * LearnAPI Service
 * Handles BO (Business Object) and FO (Function Object) operations
 */
export const learnAPIService = {

    search: ({ sessiontoken, language, pageindex, pagesize, searchtext }: SystemSearchDataRequest) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.CMS_SIMPLE_SEARCH_LEARN_API,
                fields: {
                    page_index: pageindex,
                    page_size: pagesize,
                    search_text: searchtext,
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

    view: ({ sessiontoken, language, learn_api_id }: SystemSearchDataRequest) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.CMS_GET_LEARN_API,
                fields: {
                    learn_api_id: learn_api_id,
                    channel_id: "BO"
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

    update: ({ sessiontoken, language, data }: { sessiontoken: string, language: string, data: LearnAPIType }) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.CMS_UPDATE_LEARN_API,
                fields: {
                    learn_api_id: data.learn_api_id,
                    learn_api_name: data.learn_api_name,
                    learn_api_mapping: data.learn_api_mapping,
                    channel: data.channel,
                    learn_api_mapping_response: data.learn_api_mapping_response,
                    uri: data.uri
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

    create: ({ sessiontoken, language, data }: { sessiontoken: string, language: string, data: LearnAPIType }) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.CMS_ADD_LEARN_API,
                fields: {
                    learn_api_id: data.learn_api_id,
                    learn_api_name: data.learn_api_name,
                    learn_api_mapping: data.learn_api_mapping,
                    channel: data.channel,
                    learn_api_mapping_response: data.learn_api_mapping_response,
                    uri: data.uri
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

    delete: ({ sessiontoken, language, learn_api_id }: { sessiontoken: string, language: string, learn_api_id: string }) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.CMS_DELETE_LEARN_API,
                fields: {
                    learn_api_id: learn_api_id,
                    channel_id: "BO"
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

    clearCache: ({ sessiontoken, language }: { sessiontoken: string, language: string }) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.CMS_CLEAR_CACHE,
                fields: {
                    target: "all"
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

    searchApplicationLog: ({ sessiontoken, language, pageindex, pagesize, searchtext, ...rest }: SystemSearchDataRequest) =>
        http.post<SearchDataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.LEARN_API_SIMPLE_SEARCH_APPLICATION_LOG,
                fields: {
                    page_index: pageindex,
                    page_size: pagesize,
                    search_text: searchtext,
                    ...rest
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

    getApplicationLog: ({ sessiontoken, language, correlation_id }: { sessiontoken: string, language: string, correlation_id: string }) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.LEARN_API_GET_APPLICATION_LOG,
                fields: {
                    correlation_id: correlation_id
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

    searchWorkflowLog: ({ sessiontoken, language, pageindex, pagesize, ...rest }: SystemSearchDataRequest) =>
        http.post<BODataResponse>('/system-service',
            {
                learn_api: LEARNAPICODE.LEARN_API_BO_SEARCH_WORKFLOW_LOG,
                fields: {
                    pageindex: pageindex,
                    pagesize: pagesize,
                    ...rest
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

    getWorkflowLogByExecutionId: ({ sessiontoken, language, execution_id, pageindex, pagesize }: { sessiontoken: string, language: string, execution_id: string, pageindex: number, pagesize: number }) =>
        http.post<BODataResponse<WorkflowLogDetailData>>('/system-service',
            {
                learn_api: LEARNAPICODE.LEARN_API_BO_GET_WF_LOG_BY_EXECUTION_ID,
                fields: {
                    execution_id: execution_id,
                    pageindex: pageindex,
                    pagesize: pagesize
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            })
}

