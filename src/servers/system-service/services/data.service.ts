import { env } from '@/env.mjs';
import { BODataResponse, SearchDataRequest, SearchDataResponse, UpdateDataRequest, ViewDataRequest, ViewDataResponse } from "@shared/types/systemTypes";
import { apiPost, createDefaultBody } from '../../lib/api';

/**
 * Data Service
 * Handles search, view, update and advanced search operations
 */
export const dataService = {
    /**
     * Search data with pagination
     * Validates commandname to prevent empty API calls
     */
    searchData: ({ sessiontoken, workflowid, commandname, searchtext, pageSize, pageIndex, parameters, logtype, language }: SearchDataRequest) => {
        // Validate commandname to prevent empty calls
        if (!commandname || commandname.trim() === '') {
            console.warn('âš ï¸ searchData called with empty commandname, skipping API call');
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

    /**
     * Search system data with pagination
     */
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

    /**
     * Update system data
     */
    updateSystemData: ({ sessiontoken, workflowid, data }: UpdateDataRequest) =>
        apiPost<BODataResponse>('/system-service',
            createDefaultBody(workflowid as string, data),
            sessiontoken as string,
            {
                lang: "en",
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            }
        ),

    /**
     * View data by command
     * Validates commandname to prevent empty API calls
     */
    viewData: ({ sessiontoken, workflowid, commandname, parameters }: ViewDataRequest) => {
        // Validate commandname to prevent empty calls
        if (!commandname || commandname.trim() === '') {
            console.warn('âš ï¸ viewData called with empty commandname, skipping API call');
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

    /**
     * Advanced search data
     * Validates commandname to prevent empty API calls
     */
    advanceSearchData: ({ sessiontoken, workflowid, commandname, advanccesearch, pageSize, pageIndex, language }: SearchDataRequest) => {
        // Validate commandname to prevent empty calls
        if (!commandname || commandname.trim() === '') {
            console.warn('âš ï¸ advanceSearchData called with empty commandname, skipping API call');
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
}

