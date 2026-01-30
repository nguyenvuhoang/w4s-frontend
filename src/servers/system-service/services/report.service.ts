import { env } from '@/env.mjs';
import { FODataArrayResponse, ReportDataRequest, ReportDetailDataRequest } from "@shared/types/systemTypes";
import http from "../../lib/http";

/**
 * Report Service
 * Handles report loading and report detail operations
 */
export const reportService = {
    /**
     * Load report list with pagination
     */
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

    /**
     * Load report detail by report ID
     */
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
}

