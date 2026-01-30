import { env } from "@/env.mjs";
import { DataRequest, LearnDataRequest, SubmitDataRequest, SubmitDataResponse, TableDataResponse } from "@shared/types/systemTypes";
import { apiPost, createDefaultBody } from "../lib/api";
import http from "../lib/http";

export const portalServiceApi = {
    loadDataForFormTable: ({ sessiontoken, learnapi, pageSize, pageIndex }: LearnDataRequest) =>
        http.post<TableDataResponse>('/portal-service',
            {
                type: learnapi,
                function: 'searchAll',
                data: {
                    PageSize: pageSize,
                    PageIndex: pageIndex
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: 'PORTAL'
                }
            }),

    getDetailById: ({ sessiontoken, id }: { id: string } & DataRequest) =>
        http.post<TableDataResponse>('/portal-service',
            {
                type: 'learnapi',
                function: 'searchById',
                data: id
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: 'PORTAL'
                }
            }),
    submitUpdateForm: ({ sessiontoken, data, type }: { data: any, type: string } & DataRequest) =>
        http.post<SubmitDataResponse>('/system-service',
            {
                type: type,
                function: 'update',
                data: data
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    app: 'PORTAL'
                }
            }),
    submitAddForm: ({ sessiontoken, workflowid, data, language }: SubmitDataRequest) =>
        apiPost<SubmitDataResponse>('/system-service',
            createDefaultBody(workflowid as string, data),
            sessiontoken as string,
            {
                lang: language ?? "en" as string,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
            }
        ),

}

