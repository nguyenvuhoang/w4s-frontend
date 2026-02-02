"use client";

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { Locale } from "@/configs/i18n";
import SearchIcon from "@mui/icons-material/Search";
import {
    Alert,
    Box,
    Button,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Snackbar,
    Switch,
    TextField,
    Grid,
} from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { useEffect } from "react";
import { useAddWorkflowStep } from "./useAddWorkflowStep";
import WorkflowSearchDialog from "./WorkflowSearchDialog";
import WorkflowStepList from "./WorkflowStepList";

interface AddWorkflowStepFormProps {
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    locale: Locale;
    initialWorkflowId?: string;
}

export const AddWorkflowStepForm = ({
    session,
    dictionary,
    locale,
    initialWorkflowId,
}: AddWorkflowStepFormProps) => {
    const {
        form,
        errors,
        saveSuccess,
        openSearchDialog,
        existingSteps,
        setOpenSearchDialog,
        handleChange,
        handleSave,
        clearForm,
    } = useAddWorkflowStep({ session, locale });

    useEffect(() => {
        if (initialWorkflowId) {
            handleChange("workflow_id", initialWorkflowId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialWorkflowId]);

    const services = ["AI", "CBG", "CMS", "CTH", "EXT", "LOG", "NCH", "PMT", "RPT"];

    const fieldConfig = [
        { name: "workflow_id", label: "Workflow ID", type: "custom", col: 6, required: true },
        { name: "service_id", label: "Service ID", type: "select", options: services, col: 6 },
        { name: "step_suffix", label: "Code Name (Suffix)", type: "text", col: 6, required: true },
        { name: "step_code", label: "Step Code", type: "text", col: 6, required: true, readOnly: true },
        { name: "description", label: "Description", type: "text", col: 6 },
        { name: "step_order", label: "Step Order", type: "number", col: 6, required: true, min: 1 },
        {
            name: "processing_number",
            label: "Processing Number",
            type: "select",
            col: 6,
            options: [
                { label: "Version1", value: 1 },
                { label: "StoredProcedure", value: 2 },
                { label: "ExecuteCommand", value: 5 }
            ]
        },
        { name: "status", label: "Status", type: "switch", col: 2 },
        { name: "is_reverse", label: "Is Reverse", type: "switch", col: 2 },
        { name: "should_await_step", label: "Should Await Step", type: "switch", col: 2 },
        { name: "step_time_out", label: "Step Time Out (ms)", type: "number", col: 6 },
        { name: "sending_template", label: "Sending Template", type: "json", col: 6 },
        { name: "mapping_response", label: "Mapping Response", type: "json", col: 6 },
        { name: "sending_condition", label: "Sending Condition", type: "json", col: 6 },
        { name: "sub_sending_template", label: "SubSendingTemplate", type: "json", col: 6 },
    ];

    return (
        <Box sx={{ width: "100%" }}>
            {/* Existing Steps List */}
            <WorkflowStepList steps={existingSteps} />

            <Paper
                className="p-6 rounded-2xl shadow-md bg-white mt-5"
                sx={{
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#e6e6e9" },
                        "& .MuiInputBase-input": { color: "#000000" },
                    },
                }}
            >
                <Grid container spacing={3}>
                    {fieldConfig.map((field) => {
                        const value = form[field.name as keyof typeof form];
                        const error = errors[field.name as keyof typeof errors];

                        if (field.type === "custom" && field.name === "workflow_id") {
                            return (
                                <Grid size={{ xs: 12, md: field.col }} key={field.name}>
                                    <TextField
                                        required={field.required}
                                        fullWidth
                                        label={field.label}
                                        value={(value as string) ?? ""}
                                        onClick={() => setOpenSearchDialog(true)}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setOpenSearchDialog(true)}>
                                                            <SearchIcon />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        error={!!error}
                                        helperText={error}
                                        disabled={saveSuccess}
                                    />
                                    <WorkflowSearchDialog
                                        open={openSearchDialog}
                                        onClose={() => setOpenSearchDialog(false)}
                                        onSelect={(wf) => handleChange("workflow_id", wf.workflow_id)}
                                        session={session}
                                        locale={locale}
                                        dictionary={dictionary}
                                    />
                                </Grid>
                            );
                        }

                        if (field.type === "switch") {
                            return (
                                <Grid size={{ xs: 12, md: field.col }} key={field.name}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(value)}
                                                onChange={(e) => handleChange(field.name as any, e.target.checked)}
                                            />
                                        }
                                        label={field.label}
                                        disabled={saveSuccess}
                                    />
                                </Grid>
                            );
                        }

                        if (field.type === "json") {
                            return (
                                <Grid size={{ xs: 12, md: field.col }} key={field.name}>
                                    <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>
                                        {field.label}
                                    </FormLabel>
                                    <JsonEditorComponent
                                        initialJson={JSON.parse(JSON.stringify(value ?? {}))}
                                        onChange={(newJson) => handleChange(field.name as any, newJson)}
                                        height="300px"
                                    />
                                </Grid>
                            );
                        }

                        return (
                            <Grid size={{ xs: 12, md: field.col }} key={field.name}>
                                <TextField
                                    required={field.required}
                                    fullWidth
                                    select={field.type === "select"}
                                    type={field.type === "number" ? "number" : "text"}
                                    label={field.label}
                                    value={value ?? ""}
                                    onChange={(e) => {
                                        const val =
                                            field.type === "number"
                                                ? parseInt(e.target.value) || (field.min === 0 ? 0 : 1)
                                                : e.target.value;
                                        handleChange(field.name as any, val);
                                    }}
                                    error={!!error}
                                    helperText={error}
                                    disabled={saveSuccess}
                                    slotProps={
                                        {
                                            input: {
                                                readOnly: (field as any).readOnly,
                                                inputProps: field.type === "number" ? { min: field.min } : undefined
                                            }
                                        }
                                    }
                                >
                                    {field.type === "select" &&
                                        field.options?.map((opt: any) => {
                                            const isObject = typeof opt === 'object' && opt !== null;
                                            const value = isObject ? opt.value : opt;
                                            const label = isObject ? opt.label : opt;
                                            return (
                                                <MenuItem key={value} value={value}>
                                                    {label}
                                                </MenuItem>
                                            );
                                        })}
                                </TextField>
                            </Grid>
                        );
                    })}

                    {/* Buttons */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                sx={{ px: 5 }}
                                disabled={saveSuccess}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={clearForm}
                                sx={{ px: 5 }}
                            >
                                Clear
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>


        </Box>
    );
};
