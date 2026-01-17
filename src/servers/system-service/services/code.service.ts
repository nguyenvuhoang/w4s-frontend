import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { env } from '@/env.mjs';
import { FODataArrayResponse, SystemDataRequest } from "@/types/systemTypes";
import { apiPost, createDefaultBody } from '../../lib/api';

/**
 * Code Service
 * Handles code list operations from different sources
 */
export const codeService = {
    /**
     * Get code list by code group and code name
     */
    getCdList: ({ sessiontoken, language, codegroup, codename }: { codegroup: string, codename: string } & SystemDataRequest) =>
        apiPost<FODataArrayResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.BO_GET_CDLIST_BY_CDGRP_CDNAME as string, {
                ...(codename ? { codename: codename } : {}),
                ...(codegroup ? { codegroup: codegroup } : {}),
            }),
            sessiontoken as string,
            { lang: language, app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),

    /**
     * Get code list from ACT (Active Code Table) by code group and code name
     */
    getCdListFromACT: ({ sessiontoken, language, codegroup, codename }: { codegroup: string, codename: string } & SystemDataRequest) =>
        apiPost<FODataArrayResponse>('/system-service',
            createDefaultBody(WORKFLOWCODE.BO_GET_CDLIST_BY_CDGRP_CDNAME_FROM_ACT as string, {
                ...(codename ? { codename: codename } : {}),
                ...(codegroup ? { codegroup: codegroup } : {}),
            }),
            sessiontoken as string,
            { lang: language, app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS' }
        ),
}
