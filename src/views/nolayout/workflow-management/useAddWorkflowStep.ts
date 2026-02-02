import { Locale } from "@/configs/i18n";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { workflowService } from "@/servers/system-service";
import { Session } from "next-auth";
import { useState } from "react";
import { convertKeysToSnakeCase } from "@/shared/utils/convertKeysToSnakeCase";

interface FormData {
    workflow_id: string;
    step_code: string;
    step_order: number;
    service_id: string;
    status: boolean;
    description: string;
    sending_template: Record<string, any>;
    mapping_response: Record<string, any>;
    step_time_out: number;
    sending_condition: Record<string, any>;
    processing_number: number;
    is_reverse: boolean;
    should_await_step: boolean;
    sub_sending_template: Record<string, any>;
}

interface UseAddWorkflowStepProps {
    session: Session | null;
    locale: Locale;
}

const initialFormState: FormData = {
    workflow_id: "",
    step_code: "",
    step_order: 1,
    service_id: "CBG",
    status: true,
    description: "",
    sending_template: {},
    mapping_response: {},
    step_time_out: 60000,
    sending_condition: {},
    processing_number: 0,
    is_reverse: false,
    should_await_step: true,
    sub_sending_template: {},
};

export const useAddWorkflowStep = ({ session, locale }: UseAddWorkflowStepProps) => {
    const [form, setForm] = useState<FormData>(initialFormState);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [openSearchDialog, setOpenSearchDialog] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({ open: false, message: "", severity: "success" });
    const [existingSteps, setExistingSteps] = useState<any[]>([]);

    const fetchWorkflowSteps = async (workflowId: string) => {
        if (!workflowId) return;
        try {
            const res = await workflowService.searchWorkflowStepByWorkflowId({
                sessiontoken: session?.user?.token as string,
                language: locale,
                pageindex: 0,
                pagesize: 100, // Fetch first 100 steps
                searchtext: "",
                workflowid: workflowId,
            });

            if (res?.payload?.dataresponse?.data?.items) {
                setExistingSteps(res.payload.dataresponse.data.items);
            } else {
                setExistingSteps([]);
            }
        } catch (error) {
            console.error("Error fetching workflow steps:", error);
            setExistingSteps([]);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!form.workflow_id || form.workflow_id.trim() === "") {
            newErrors.workflow_id = "WorkflowId is required";
        }

        if (!form.step_code || form.step_code.trim() === "") {
            newErrors.step_code = "StepCode is required";
        }

        if (!form.step_order || form.step_order < 1) {
            newErrors.step_order = "StepOrder must be greater than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof FormData, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));

        if (field === "workflow_id") {
            fetchWorkflowSteps(value);
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Missing required data!",
                severity: "error",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await workflowService.runBODynamic({
                sessiontoken: session?.user?.token,
                txFo: {
                    bo: [{
                        use_microservice: true,
                        input: {
                            workflowid: "",
                            learn_api: WORKFLOWCODE.WFSTEP_INSERT,
                            fields: { wfstep: convertKeysToSnakeCase(form) },
                        },
                    }],
                },
            });

            const isInsertSuccess = res?.payload?.dataresponse?.errors?.length === 0;

            if (isInsertSuccess) {
                setSnackbar({
                    open: true,
                    message: "Add success!",
                    severity: "success",
                });
                setSaveSuccess(true);
                // Refresh existing steps after successful add
                fetchWorkflowSteps(form.workflow_id);
            } else {
                const errorInfo = res?.payload?.dataresponse?.errors?.[0]?.info || "Unknown error";
                setSnackbar({
                    open: true,
                    message: `Add failed!\n${errorInfo}`,
                    severity: "error",
                });
            }
        } catch (err) {
            console.error("Error saving WorkflowStep:", err);
            setSnackbar({ open: true, message: "Add failed!", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setForm(initialFormState);
        setSaveSuccess(false);
        setErrors({});
        setExistingSteps([]);
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    return {
        form,
        errors,
        loading,
        saveSuccess,
        snackbar,
        openSearchDialog,
        existingSteps,
        setOpenSearchDialog,
        handleChange,
        handleSave,
        clearForm,
        handleCloseSnackbar
    };
};
