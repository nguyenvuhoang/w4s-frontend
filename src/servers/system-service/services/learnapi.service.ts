import { LEARNAPICODE } from '@/data/LearnAPICode';
import { env } from '@/env.mjs';
import { BODataResponse, LearnAPIType, SystemSearchDataRequest } from "@shared/types/systemTypes";
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
            })
}

