import Application from "@/@core/lib/libSupport";
import { portalServiceApi } from "@/servers/portal-service";
import { getDictionary } from "@/utils/getDictionary";
import { removeUnderscores } from "@/utils/removeUnderscores";
import SwalAlert from "@/utils/SwalAlert";
import { Session } from "next-auth";

export const handlePostUpdateData = async (
    session: Session | null,
    txFo_: any,
    formData: any,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
) => {
    try {
        const submitForm = await portalServiceApi.submitUpdateForm({
            sessiontoken: session?.user?.token as string,
            type: removeUnderscores(txFo_[0].input.table_code),
            data: formData,
        });

        const transactionresponse = submitForm.payload.dataresponse;

        if (transactionresponse.status === true) {
            SwalAlert('success', dictionary['common'].success, 'center');
        } else {
            SwalAlert('error', dictionary['common'].error, 'center');
        }
    } catch (error) {
        Application.AppException("#CBUTTON.onClick", String(error), "Error");
    }
};
