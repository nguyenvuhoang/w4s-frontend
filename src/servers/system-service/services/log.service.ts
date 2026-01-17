import { env } from '@/env.mjs';
import { FODataArrayResponse, SystemDataRequest } from "@/types/systemTypes";
import http from "../../lib/http";

/**
 * Log Service
 * Handles workflow log operations
 */

/**
 * Request parameters for loading logs by execution ID
 */
export interface LoadLogByExecutionIdRequest extends SystemDataRequest {
    pageindex: number;
    pagesize: number;
    execution_id: string;
}

export const logService = {
    /**
     * Load workflow logs by execution ID
     * @param sessiontoken - User session token
     * @param language - Language code
     * @param pageindex - Page index for pagination (0-based)
     * @param pagesize - Number of records per page
     * @param execution_id - Workflow execution ID
     */
    loadLogByExecutionId: ({ 
        sessiontoken, 
        language, 
        pageindex, 
        pagesize, 
        execution_id 
    }: LoadLogByExecutionIdRequest) =>
        http.post<FODataArrayResponse>('/system-service',
            {
                learn_api: "LEARN_API_BO_GET_WF_LOG_BY_EXECUTION_ID",
                fields: {
                    pageindex: pageindex,
                    pagesize: pagesize,
                    execution_id: execution_id
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
}
