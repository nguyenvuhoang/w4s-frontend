import Application from "@/@core/lib/libSupport";
import { systemServiceApi } from "@/servers/system-service";
import { Session } from "next-auth";

export const handleAdvanceSearchAPI = async (session: Session | null, txFo_: any, pageIndex: number, pageSize: number, advanccesearch?: any) => {
    try {
        const inputdata = txFo_[0].input;
        const submitForm = await systemServiceApi.advanceSearchData({
            sessiontoken: session?.user?.token as string,
            learnapi: inputdata.learn_api,
            workflowid: inputdata.workflowid,
            commandname: inputdata.fields.commandname,
            pageSize: pageSize,
            pageIndex: pageIndex,
            advanccesearch: advanccesearch
        });

        const transactionresponse = submitForm.payload.dataresponse;

        return transactionresponse.fo[0].input;

    } catch (error) {
        Application.AppException("#CBUTTON.onClick", String(error), "Error");
    }
};
