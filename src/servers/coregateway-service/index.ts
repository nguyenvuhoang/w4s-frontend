import { FODataResponse, SearchDataRequest, SearchDataResponse } from "@/types/systemTypes";
import { apiPost, createDefaultBody } from "../lib/api";
import { env } from "@/env.mjs";
import { RequestDataDefault } from "@/types";

export const coreGetWayServiceApi = {
    coreGatewaySearchInfo: ({ sessiontoken, language, commandname, pageSize, pageIndex }: SearchDataRequest) =>
        apiPost<SearchDataResponse>('/system-service',
            createDefaultBody("CBG_EXECUTE_SQL",
                {
                    commandname: commandname,
                    issearch: true,
                    pageindex: pageIndex,
                    pagesize: pageSize,
                    parameters: {
                        searchtext: ''
                    }
                }
            ),
            sessiontoken as string,
            {
                lang: language as string,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS',
            },

        ),

    GenerateToken: ({ sessiontoken, language, secretkey }: RequestDataDefault) =>
        apiPost<FODataResponse>('/system-service',
            createDefaultBody("CBW_CREATE_TOKEN",
                {
                    identifier: secretkey
                }
            ),
            sessiontoken as string,
            {
                lang: language as string,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS',
            },

        ),

}
