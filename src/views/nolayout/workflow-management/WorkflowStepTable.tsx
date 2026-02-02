import JsonEditorComponent from "@/@core/components/jSONEditor";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ContentCopyTwoToneIcon from "@mui/icons-material/ContentCopyTwoTone";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    IconButton,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
    useTheme
} from "@mui/material";
import React, { useState } from "react";
import EditableCell from "./EditableCell";
import { WorkflowStepType } from "./types";

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
    updateWfStep,
    selectedWfStep,
    setSelectedWfStep,
}: {
    steps: WorkflowStepType[];
    updateWfStep: (wfStep: object) => Promise<any>;
    selectedWfStep: string[];
    setSelectedWfStep: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
    const [rows, setRows] = useState(steps);
    const theme = useTheme();
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
    const nonEditableFields: (keyof WorkflowStepType)[] = [
        "WorkflowId",
        "StepCode",
    ];

    const handleChange = (index: number, key: keyof WorkflowStepType, val: any) => {
        setEditingRows((prev) => ({
            ...prev,
            [index]: {
                ...rows[index],
                ...prev[index],
                [key]: val,
            },
        }));

        setDirtyRows((prev) => new Set(prev).add(index));
    };

    const handleSave = async (index: number) => {
        try {
            const wfStepSave: WorkflowStepType = editingRows[index] ?? rows[index];
            console.log("Save WorkflowStep:", wfStepSave);

            const res = await updateWfStep(wfStepSave);
            const isUpdateSuccess = res?.payload?.dataresponse?.error?.length === 0;

            if (isUpdateSuccess) {
                setDirtyRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });

                setRows((prev) => {
                    const newRows = [...prev];
                    newRows[index] = wfStepSave;
                    return newRows;
                });
                setSnackbar({
                    open: true,
                    message: "Update success!",
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message:
                        "Update failed!\n" + res?.payload?.dataresponse?.error[0]?.info,
                    severity: "error",
                });
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Update failed!", severity: "error" });
            console.error("Error while saving WorkflowStep:", err);
        }
    };

    const handleCancel = (index: number) => {
        const newRows = [...rows];
        newRows[index] = steps[index];
        setRows(newRows);

        setEditingRows((prev) => {
            const newEditing = { ...prev };
            delete newEditing[index]; // Use delete instead of assigning steps[index] to clean state
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

    const handleSelectOne = (row: WorkflowStepType) => {
        const id = getRowKey(row);
        setSelectedWfStep((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

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
                                    {/* Selection Checkbox Row */}
                                    <TableRow>
                                        <TableCell sx={{ borderBottom: "none", p: 1 }}>
                                            <Box
                                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                            >
                                                <Checkbox
                                                    sx={{
                                                        p: 0,
                                                        "& .MuiTouchRipple-root": {
                                                            color: theme.palette.primary.light,
                                                        },
                                                    }}
                                                    checked={selectedWfStep.includes(id)}
                                                    onChange={() => handleSelectOne(step)}
                                                    icon={
                                                        <CheckBoxOutlineBlankIcon sx={{ color: theme.palette.action.disabled }} />
                                                    }
                                                    checkedIcon={<CheckBoxIcon sx={{ color: theme.palette.primary.main }} />}
                                                />
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Select Step
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>

                                    {Object.entries(step).map(([key, value]) => {
                                        const typedKey = key as keyof WorkflowStepType;
                                        const currentValue = editingRows[index]?.[typedKey] ?? rows[index][typedKey];

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
                                                        width: "30%", // Percentage based width for better response
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
                                                            onClick={() => handleCopy(value)}
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
