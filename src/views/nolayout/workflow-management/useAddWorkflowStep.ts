import { Locale } from "@/configs/i18n";
import { workflowService } from "@/servers/system-service";
import { convertKeysToSnakeCase } from "@/shared/utils/convertKeysToSnakeCase";
import SwalAlert from "@/shared/utils/SwalAlert";
import { Session } from "next-auth";
import { useState } from "react";

interface FormData {
    workflow_id: string;
    step_code: string;
    step_suffix: string; // New field for code generation
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
    step_suffix: "",
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
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };

            // Auto-generate step_code based on service_id and step_suffix
            if (field === "service_id" || field === "step_suffix") {
                const serviceId = field === "service_id" ? (value as string) : prev.service_id;
                const suffix = field === "step_suffix"
                    ? (value as string | undefined)?.toUpperCase() ?? ""
                    : (prev.step_suffix as string | undefined)?.toUpperCase() ?? "";

                if (suffix) {
                    // Clean suffix to only allow alphanumeric and underscores
                    const cleanSuffix = suffix.replace(/[^A-Z0-9_]/g, "");
                    // Update suffix if it was changed
                    if (field === "step_suffix") {
                        newForm.step_suffix = cleanSuffix;
                    }
                    newForm.step_code = `WF_STEP_${serviceId}_${cleanSuffix}`;
                } else {
                    newForm.step_code = "";
                }
            }

            return newForm;
        });
        setErrors((prev) => ({ ...prev, [field]: "" }));

        if (field === "workflow_id") {
            fetchWorkflowSteps(value);
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            SwalAlert("error", "Missing required data!");
            return;
        }

        setLoading(true);
        try {
            // Exclude step_suffix from the API payload
            const { step_suffix, ...wfStepData } = form;

            // Convert json fields to jsonstring
            const payload = {
                ...wfStepData,
                sending_template: JSON.stringify(wfStepData.sending_template),
                mapping_response: JSON.stringify(wfStepData.mapping_response),
                sending_condition: JSON.stringify(wfStepData.sending_condition),
                sub_sending_template: JSON.stringify(wfStepData.sub_sending_template),
            };

            const res = await workflowService.createWorkflowStep({
                sessiontoken: session?.user?.token as string,
                fields: {
                    list_step: [convertKeysToSnakeCase(payload)],
                },
                language: locale,
            });

            const isInsertSuccess = res?.payload?.dataresponse?.errors?.length === 0;

            if (isInsertSuccess) {
                SwalAlert("success", "Add success!");
                setSaveSuccess(true);
                // Refresh existing steps after successful add
                fetchWorkflowSteps(form.workflow_id);
            } else {
                const errorInfo = res?.payload?.dataresponse?.errors?.[0]?.info || "Unknown error";
                const executionId = res?.payload?.dataresponse?.executionid || "Unknown execution id";
                SwalAlert("error", `Add failed!\n${errorInfo}\nExecution ID: ${executionId}`);
            }
        } catch (err) {
            console.error("Error saving WorkflowStep:", err);
            SwalAlert("error", "Add failed!");
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
        // No longer needed
    };

    return {
        form,
        errors,
        loading,
        saveSuccess,
        openSearchDialog,
        existingSteps,
        setOpenSearchDialog,
        handleChange,
        handleSave,
        clearForm
    };
};
