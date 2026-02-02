import { Locale } from "@/configs/i18n";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { workflowService } from "@/servers/system-service";
import { Session } from "next-auth";
import { useState } from "react";
import { convertKeysToSnakeCase } from "@/shared/utils/convertKeysToSnakeCase";

export interface WorkflowDefinitionFormData {
    WorkflowId: string;
    WorkflowCode: string; // New field for code generation
    WorkflowName: string;
    Description: string;
    ChannelId: string;
    Status: boolean;
    IsReverse: boolean;
    TimeOut: number;
    Templateresponse: string;
    WorkflowEvent: string;
}

interface UseAddWorkflowDefinitionProps {
    session: Session | null;
    locale: Locale;
}

const initialFormState: WorkflowDefinitionFormData = {
    WorkflowId: "",
    WorkflowCode: "",
    WorkflowName: "",
    Description: "",
    ChannelId: "BO",
    Status: true,
    IsReverse: false,
    TimeOut: 60000,
    Templateresponse: "{}",
    WorkflowEvent: "",
};

export const useAddWorkflowDefinition = ({ session, locale }: UseAddWorkflowDefinitionProps) => {
    const [form, setForm] = useState<WorkflowDefinitionFormData>(initialFormState);
    const [errors, setErrors] = useState<Partial<Record<keyof WorkflowDefinitionFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({ open: false, message: "", severity: "success" });

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof WorkflowDefinitionFormData, string>> = {};

        if (!form.WorkflowId || form.WorkflowId.trim() === "") {
            newErrors.WorkflowId = "WorkflowId is required";
        }

        if (!form.ChannelId || form.ChannelId.trim() === "") {
            newErrors.ChannelId = "ChannelId is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof WorkflowDefinitionFormData, value: any) => {
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };

            // Auto-generate WorkflowId when ChannelId or WorkflowCode changes
            if (field === "ChannelId" || field === "WorkflowCode") {
                const code = field === "WorkflowCode" ? (value as string).toUpperCase() : prev.WorkflowCode.toUpperCase();
                const channel = field === "ChannelId" ? (value as string) : prev.ChannelId;

                if (code) {
                    const generatedId = `WF_${channel}_${code}`;
                    newForm.WorkflowId = generatedId;
                    newForm.WorkflowName = generatedId; // Sync name with ID
                } else {
                    newForm.WorkflowId = "";
                    newForm.WorkflowName = "";
                }

                if (field === "WorkflowCode") {
                    newForm.WorkflowCode = (value as string).toUpperCase().replace(/[^A-Z0-9_]/g, "");
                }
            }

            return newForm;
        });
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleSave = async (onSuccessCallback?: (workflowId: string) => void) => {
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Missing require data!",
                severity: "error",
            });
            return;
        }

        setLoading(true);
        try {
            const { WorkflowCode: _, ...wfDefData } = form;
            const res = await workflowService.createWorkflowDefinition({
                language: locale,
                sessiontoken: session?.user?.token as string,
                fields: convertKeysToSnakeCase(wfDefData),
            });

            const isInsertSuccess = res?.payload?.dataresponse?.errors?.length === 0;

            if (isInsertSuccess) {
                setSnackbar({
                    open: true,
                    message: "Add success!",
                    severity: "success",
                });
                setSaveSuccess(true);
                if (onSuccessCallback) {
                    onSuccessCallback(form.WorkflowId);
                }
            } else {
                const errorInfo = res?.payload?.dataresponse?.errors?.[0]?.info || "Unknown error";
                setSnackbar({
                    open: true,
                    message: `Add failed!\n${errorInfo}`,
                    severity: "error",
                });
            }
        } catch (err) {
            console.error("Error while saving WorkflowDefinition:", err);
            setSnackbar({ open: true, message: "Add failed!", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setForm(initialFormState);
        setSaveSuccess(false);
        setErrors({});
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
        handleChange,
        handleSave,
        clearForm,
        handleCloseSnackbar,
    };
};
