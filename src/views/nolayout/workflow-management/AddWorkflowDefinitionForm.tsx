"use client";

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { Locale } from "@/configs/i18n";
import {
    Alert,
    Box,
    Button,
    FormControlLabel,
    FormLabel,
    Grid,
    MenuItem,
    Paper,
    Snackbar,
    Switch,
    TextField,
} from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { useAddWorkflowDefinition } from "./useAddWorkflowDefinition";

interface AddWorkflowDefinitionFormProps {
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    onSuccess?: (workflowId: string) => void;
    hideClear?: boolean;
    locale: Locale;
}

export const AddWorkflowDefinitionForm = ({
    session,
    dictionary,
    onSuccess,
    hideClear = false,
    locale
}: AddWorkflowDefinitionFormProps) => {
    const {
        form,
        errors,
        loading,
        saveSuccess,
        snackbar,
        handleChange,
        handleSave,
        clearForm,
        handleCloseSnackbar,
    } = useAddWorkflowDefinition({ session, locale: locale });

    const channels = ["BO", "COREAPI", "MB", "PORTAL", "SMS", "SYS", "TELLERAPP"];

    return (
        <Box sx={{ width: "100%" }}>
            <Paper
                className="p-6 rounded-2xl shadow-md bg-white"
                sx={{
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderWidth: "1px",
                            borderColor: "#e6e6e9",
                        },
                        "& .MuiInputBase-input": {
                            color: "#000000",
                        },
                    },
                }}
            >
                <Grid
                    container
                    spacing={3}
                    sx={{
                        "& .MuiFormLabel-asterisk": {
                            color: "red",
                            fontSize: "1.3rem",
                        },
                        "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#e6e6e9",
                        },
                    }}
                >
                    {/* WorkflowCode + WorkflowId */}
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="Workflow Code"
                            placeholder="e.g. LOGIN"
                            value={form.WorkflowCode}
                            onChange={(e) => handleChange("WorkflowCode", e.target.value)}
                            error={!!errors.WorkflowId} // Use WorkflowId error for the code as well
                            helperText="Enter name to auto-generate WorkflowId"
                            disabled={saveSuccess}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="WorkflowId (Auto-generated)"
                            value={form.WorkflowId}
                            disabled
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    style: { backgroundColor: "#f5f5f5" }
                                }
                            }}
                        />
                    </Grid>

                    {/* WorkflowName (Auto-sync) + ChannelId */}
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="WorkflowName (Auto-sync)"
                            value={form.WorkflowName}
                            disabled
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    style: { backgroundColor: "#f5f5f5" }
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                        <TextField
                            required
                            select
                            fullWidth
                            label="ChannelId"
                            value={form.ChannelId}
                            onChange={(e) => handleChange("ChannelId", e.target.value)}
                            error={!!errors.ChannelId}
                            helperText={errors.ChannelId}
                            disabled={saveSuccess}
                        >
                            {channels.map((c) => (
                                <MenuItem key={c} value={c}>
                                    {c}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Description */}
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={form.Description}
                            onChange={(e) => handleChange("Description", e.target.value)}
                            disabled={saveSuccess}
                        />
                    </Grid>

                    {/* Status + IsReverse */}
                    <Grid size={{ xs: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.Status}
                                    onChange={(e) => handleChange("Status", e.target.checked)}
                                />
                            }
                            label="Status"
                            disabled={saveSuccess}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.IsReverse}
                                    onChange={(e) => handleChange("IsReverse", e.target.checked)}
                                />
                            }
                            label="IsReverse"
                            disabled={saveSuccess}
                        />
                    </Grid>

                    {/* TimeOut + WorkflowEvent */}
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="TimeOut (ms)"
                            value={form.TimeOut}
                            onChange={(e) => handleChange("TimeOut", parseInt(e.target.value) || 0)}
                            disabled={saveSuccess}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            multiline
                            label="WorkflowEvent"
                            value={form.WorkflowEvent}
                            onChange={(e) => handleChange("WorkflowEvent", e.target.value)}
                            disabled={saveSuccess}
                        />
                    </Grid>

                    {/* TemplateResponse (JSON Editor) */}
                    <Grid size={{ xs: 12 }}>
                        <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>TemplateResponse</FormLabel>
                        <JsonEditorComponent
                            initialJson={JSON.parse(JSON.stringify(form.Templateresponse ?? {}))}
                            onChange={(newJson) => handleChange("Templateresponse", newJson)}
                            height="300px"
                        />
                    </Grid>

                    {/* Buttons */}
                    <Grid size={{ xs: 12 }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleSave(onSuccess)}
                                sx={{ px: 10, py: 2 }}
                                disabled={saveSuccess || loading}
                            >
                                {loading ? "Saving..." : "Save"}
                            </Button>
                            {!hideClear && (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    sx={{ px: 10, py: 2 }}
                                    onClick={clearForm}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }} onClose={handleCloseSnackbar}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
