import { Locale } from "@/configs/i18n";
import { codeService } from "@/servers/system-service";
import SwalAlert from "@/utils/SwalAlert";
import { Session } from "next-auth";

export const handleGetCodeList = async (session: Session | null, codegroup: string, codename: string, language: Locale) => {
    try {
        const response = await codeService.getCdListFromACT({
            sessiontoken: session?.user?.token as string,
            language: language,
            codegroup: codegroup,
            codename: codename
        });

        const dataresponse = response.payload.dataresponse;

        const errorInfo = dataresponse.errors;

        if (errorInfo.length > 0) {
            SwalAlert('error', 'Please check code list config. Maybe have no config code group or code name', 'center');
            return undefined;
        }

        return dataresponse.data.input;

    } catch (error) {
        console.log(error);
    }
};
