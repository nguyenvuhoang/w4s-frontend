import JsonEditorComponent from "@/@core/components/jSONEditor";
import CancelIcon from "@mui/icons-material/Cancel";
import ContentCopyTwoToneIcon from "@mui/icons-material/ContentCopyTwoTone";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
    useTheme
} from "@mui/material";
import React, { useState, useEffect } from "react";
import EditableCell from "./EditableCell";
import { WorkflowDefinitionType, WorkflowStepType } from "./types";

function SafeJsonEditor({
    initialValue,
    onChange,
}: {
    initialValue: any;
    onChange: (val: any) => void;
}) {
    // Ensure we always have a valid object for the editor
    const safeJson =
        typeof initialValue === "string"
            ? JSON.parse(initialValue || "{}")
            : initialValue || {};

    return (
        <JsonEditorComponent
            initialJson={safeJson}
            onChange={onChange}
            height="300px"
        />
    );
}

const WorkflowStepTable = ({
    steps,
    setWfStepsMap,
    wfDef,
    updateWorkflow,
}: {
    steps: WorkflowStepType[];
    setWfStepsMap: React.Dispatch<React.SetStateAction<WorkflowStepType[]>>;
    wfDef: WorkflowDefinitionType;
    updateWorkflow: (wfDef: WorkflowDefinitionType, listStep: WorkflowStepType[]) => Promise<any>;
}) => {
    const theme = useTheme();
    const [prevSteps, setPrevSteps] = useState(steps);
    const [editingRows, setEditingRows] = useState<
        Record<number, WorkflowStepType>
    >({});
    const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    if (steps !== prevSteps) {
        setPrevSteps(steps);
        setEditingRows({});
        setDirtyRows(new Set());
    }

    const nonEditableFields: (keyof WorkflowStepType)[] = [
        "WorkflowId",
        "StepCode",
    ];

    const handleChange = (index: number, key: keyof WorkflowStepType, val: any) => {
        const updatedRow = {
            ...steps[index],
            ...editingRows[index],
            [key]: val,
        };
        setEditingRows((prev) => ({
            ...prev,
            [index]: updatedRow,
        }));

        setDirtyRows((prev) => new Set(prev).add(index));
    };

    const handleSave = async (index: number) => {
        try {
            const wfStepSave: WorkflowStepType = editingRows[index] ?? steps[index];

            // Create a temp list of steps with the updated step
            const updatedSteps = [...steps];
            updatedSteps[index] = wfStepSave;

            const res = await updateWorkflow(wfDef, updatedSteps);
            const isUpdateSuccess = res?.payload?.dataresponse?.errors?.length === 0;

            if (isUpdateSuccess) {
                setDirtyRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });

                // Sync back to parent
                setWfStepsMap(updatedSteps);

                setSnackbar({
                    open: true,
                    message: "Update success!",
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message:
                        "Update failed!\n" + (res?.payload?.dataresponse?.errors?.[0]?.info || "Unknown error"),
                    severity: "error",
                });
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Update failed!", severity: "error" });
            console.error("Error while saving WorkflowStep:", err);
        }
    };

    const handleCancel = (index: number) => {
        setEditingRows((prev) => {
            const newEditing = { ...prev };
            delete newEditing[index];
            return newEditing;
        });

        setDirtyRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };

    const handleCopy = (value: any) => {
        navigator.clipboard.writeText(
            typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)
        );
        setSnackbar({
            open: true,
            message: "Copy success to clipboard!",
            severity: "success",
        });
    };

    const getRowKey = (row: WorkflowStepType) =>
        `${row.WorkflowId}#${row.StepCode}#${row.StepOrder}`;

    return (
        <Box sx={{ p: 2, backgroundColor: theme.palette.action.hover }}>
            {steps.map((step, index) => {
                const isDirty = dirtyRows.has(index);
                const id = getRowKey(step);
                return (
                    <Card
                        key={id}
                        elevation={3}
                        sx={{
                            mb: 3,
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 2,
                            overflow: "hidden",
                        }}
                    >
                        {/* Header bar for visual distinction */}
                        <Box sx={{
                            backgroundColor: theme.palette.primary.main,
                            height: 4,
                            width: '100%'
                        }} />
                        <CardContent sx={{ p: 0 }}>
                            <Table size="small" sx={{ width: "100%" }}>
                                <TableBody>
                                    {Object.entries(step).map(([key, value]) => {
                                        const typedKey = key as keyof WorkflowStepType;
                                        const currentValue = editingRows[index]?.[typedKey] ?? steps[index][typedKey];

                                        return (
                                            <TableRow
                                                key={key}
                                                sx={{
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    "&:last-child": {
                                                        borderBottom: "none",
                                                    },
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        width: "30%",
                                                        minWidth: 200,
                                                        maxWidth: 300,
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        borderBottom: "none",
                                                        verticalAlign: 'top',
                                                        pt: 2
                                                    }}
                                                >
                                                    {key}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        width: "70%",
                                                        position: "relative",
                                                        "&:hover .action-buttons": {
                                                            opacity: 1,
                                                            pointerEvents: "auto",
                                                        },
                                                        borderBottom: "none",
                                                        pt: 1,
                                                        pb: 1
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                                                        {[
                                                            "SendingTemplate",
                                                            "MappingResponse",
                                                            "SendingCondition",
                                                            "SubSendingTemplate",
                                                        ].includes(key) ? (
                                                            <Box sx={{ width: "100%", mt: 1 }}>
                                                                <SafeJsonEditor
                                                                    initialValue={currentValue}
                                                                    onChange={(newJson) =>
                                                                        handleChange(index, typedKey, newJson)
                                                                    }
                                                                />
                                                            </Box>
                                                        ) : (
                                                            <EditableCell
                                                                value={
                                                                    typeof currentValue === "object"
                                                                        ? ""
                                                                        : String(currentValue ?? "")
                                                                }
                                                                onChange={(val) =>
                                                                    handleChange(index, typedKey, val)
                                                                }
                                                                disabled={nonEditableFields.includes(typedKey)}
                                                            />
                                                        )}
                                                    </Box>

                                                    <Box
                                                        className="action-buttons"
                                                        sx={{
                                                            position: "absolute",
                                                            right: 0,
                                                            top: 10,
                                                            display: "flex",
                                                            gap: 0.5,
                                                            opacity: 0,
                                                            pointerEvents: "none",
                                                            transition: "opacity 0.2s",
                                                            backgroundColor: theme.palette.background.paper,
                                                            boxShadow: theme.shadows[1],
                                                            borderRadius: 1,
                                                            zIndex: 1
                                                        }}
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleCopy(currentValue)}
                                                        >
                                                            <ContentCopyTwoToneIcon fontSize="small" />
                                                        </IconButton>
                                                        {!nonEditableFields.includes(typedKey) && (
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() =>
                                                                    handleChange(
                                                                        index,
                                                                        key as keyof WorkflowStepType,
                                                                        typeof value === "object" ? {} : ""
                                                                    )
                                                                }
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {isDirty && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: 2,
                                        p: 2,
                                        borderTop: `1px solid ${theme.palette.divider}`,
                                        backgroundColor: theme.palette.action.hover
                                    }}
                                >
                                    <Button
                                        onClick={() => handleSave(index)}
                                        startIcon={<SaveIcon />}
                                        variant="contained"
                                        color="primary"
                                    >
                                        Save Change
                                    </Button>
                                    <Button
                                        onClick={() => handleCancel(index)}
                                        startIcon={<CancelIcon />}
                                        variant="outlined"
                                        color="secondary"
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default WorkflowStepTable;
