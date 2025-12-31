import Application from "@/@core/lib/libSupport";
import { portalServiceApi } from "@/servers/portal-service";
import { getDictionary } from "@/utils/getDictionary";
import { isValidResponse } from "@/utils/isValidResponse";
import SwalAlert from "@/utils/SwalAlert";
import { Session } from "next-auth";

export const handlePostAddData = async (
    session: Session | null,
    txFo_: any,
    formData: any,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
): Promise<boolean> => {
    try {
        const data: any = {
            ...formData,
            ...(formData.gender
                ? { gender: formData.gender === 'M' ? 1 : 0 }
                : {}),
        };

        const submitForm = await portalServiceApi.submitAddForm({
            sessiontoken: session?.user?.token as string,
            workflowid: txFo_[0].workflowid,
            data: data
        });

        if (
            !isValidResponse(submitForm) ||
            (submitForm.payload.dataresponse.error && submitForm.payload.dataresponse.error.length > 0)
        ) {
            const error = submitForm.payload.dataresponse.error?.[0];
            const errorString = `ExecutionID: ${error?.execute_id ?? ''} - ${error?.info ?? 'Unknown error'}`;
            SwalAlert('error', errorString, 'center');
            return false;
        }

        SwalAlert(
            'success',
            dictionary['common'].datachange.replace("{0}", txFo_[0].workflowid),
            'center',
            false,
            false,
            true
        );
        return true;

    } catch (error) {
        Application.AppException("#CBUTTON.onClick", String(error), "Error");
        SwalAlert('error', dictionary['common'].error, 'center');
        return false;
    }
};
