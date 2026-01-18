import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { dataService, workflowService } from "@/servers/system-service";
import { isValidResponse } from "@/utils/isValidResponse";
import SwalAlert from "@/utils/SwalAlert";

export async function handleResetPassword({ data, setLoading, dictionary, router }: any) {
    try {
        setLoading(true);

        const dataviewAPI = await dataService.viewData({
            sessiontoken: "",
            learnapi: "cbs_workflow_execute",
            workflowid: "BO_EXECUTE_SQL_WITHOUT_LOGIN_CTH",
            commandname: "getUserByUserName",
            issearch: false,
            parameters: { id: data.username },
        });

        if (
            !isValidResponse(dataviewAPI) ||
            (dataviewAPI.payload.dataresponse.errors &&
                dataviewAPI.payload.dataresponse.errors.length > 0)
        ) {
            SwalAlert("error", dataviewAPI.payload.dataresponse.errors[0].info as string, "center");
            return;
        }
        const viewdata = dataviewAPI.payload.dataresponse.data.data[0];
        if (!viewdata) {
            SwalAlert("error", "User is not exist!", "center");
            return;
        }

        if (viewdata.email !== data.email) {
            SwalAlert(
                "error",
                "Email is incorrect!\nPlease enter your registered email!",
                "center"
            );
            return;
        }

        const response = await workflowService.runFODynamic({
            workflowid: WORKFLOWCODE.WF_BO_USER_RESET_PASSWORD,
            sessiontoken: "",
            input: {
                usercode: viewdata.usercode,
                email: data.email,
            },
        });

        if (
            !isValidResponse(response) ||
            (response.payload.dataresponse.errors &&
                response.payload.dataresponse.errors.length > 0)
        ) {
            SwalAlert("error", response.payload.dataresponse.errors[0].info as string, "center");
            return;
        }

        SwalAlert(
            "success",
            dictionary["auth"].resetpasswordsuccess,
            "center",
            false, // allowOutsideClick
            false, // showCancelButton
            true, // withConfirm
            () => {
                router.push("/login");
            }
        );

    } catch (err) {
        SwalAlert(
            "error",
            err instanceof Error ? err.message : "An error occurred",
            "center"
        );
    } finally {
        try {
            setLoading(false);
        } catch (_) { }
    }
}
