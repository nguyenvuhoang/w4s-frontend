import { Locale } from "@/configs/i18n";
import { systemServiceApi } from "@/servers/system-service";
import SwalAlert from "@/utils/SwalAlert";
import { Session } from "next-auth";

export const handleSearchAPI = async (session: Session | null, txFo_: any, pageIndex: number, pageSize: number, searchtext?: string, parameters?: { [key: string]: any }, language?: Locale) => {
    try {
        const inputdata = txFo_[0].input;
        const submitForm = await systemServiceApi.searchData({
            sessiontoken: session?.user?.token as string,
            workflowid: inputdata.workflowid,
            commandname: inputdata.fields.commandname,
            searchtext: searchtext ? searchtext : '',
            pageSize: pageSize,
            pageIndex: pageIndex,
            parameters: parameters ?? inputdata?.parameters ?? {},
            language: language ?? 'en',
        });

        const transactionresponse = submitForm.payload.dataresponse;

        const errorInfo = transactionresponse.errors;

        if (errorInfo.length > 0) {
            SwalAlert('error', errorInfo[0].info, 'center');
            return undefined;
        }
        return transactionresponse.data;

    } catch (error) {
        console.log(error);
    }
};
