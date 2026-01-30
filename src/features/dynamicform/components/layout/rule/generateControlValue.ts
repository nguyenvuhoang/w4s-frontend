import Application from "@/@core/lib/libSupport";
import { workflowService } from "@/servers/system-service";
import { RuleStrong } from "@shared/types/systemTypes";
import { generateDefaultString } from "@utils/generateDefaultString";
import SwalAlert from "@utils/SwalAlert";
import { Session } from "next-auth";

export const generateControlValue = async (sessiontoken: Session | null, columnKey: string, rules: RuleStrong[]): Promise<string> => {
    const runFORules = rules.find(rule => rule.code === 'runFo' && rule.config?.component_action === columnKey);

    if (runFORules) {
        const { txFo } = runFORules.config || {};
        const txFo_ = JSON.parse(txFo);
        if (txFo_ !== undefined) {
            const txcode = txFo_[0].txcode;
            switch (txcode) {
                case 'fo-get-info':
                    const learnApi = txFo_[0]?.input.learn_api;
                    const workflowid = txFo_[0]?.input.workflow_id;
                    const runFO = await workflowService.runFO({
                        sessiontoken: sessiontoken?.user?.token,
                        learnapi: learnApi,
                        workflowid: workflowid
                    })

                    const inputData = runFO.payload.dataresponse.data.input;
                    if (inputData) {
                        return inputData[columnKey];
                    }

                    break;
                case 'fo-get-default-string':
                    const value = generateDefaultString(10);
                    return value;
                default:
                    SwalAlert('error', 'Unknown transaction code', 'center');
                    break;
            }
        } else {
            Application.AppException("#generateControlValue", "Error Json is undefined", "Error");
        }
    }
    return '';
};

