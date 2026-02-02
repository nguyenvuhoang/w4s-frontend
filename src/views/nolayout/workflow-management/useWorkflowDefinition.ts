import { useEffect, useState } from "react";
import {
    wfDefKeyMap,
    wfStepKeyMap,
    WorkflowDefinitionType,
    WorkflowStepType,
} from "./types";

function safeJsonParseObject(
    value: string | Record<string, any>
): Record<string, any> {
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

function renameKeys<T>(
    obj: Record<string, any>,
    map: Record<string, keyof T>
): T {
    const newObj = {} as T;

    for (const [oldKey, newKey] of Object.entries(map)) {
        if (oldKey in obj) {
            newObj[newKey] = obj[oldKey];
        }
    }

    return newObj;
}

interface UseWorkflowDefinitionProps {
    items: any[];
    loadWfStep: (workflowId: string) => Promise<WorkflowStepType[]>;
    updateWfDef: (wfDef: object) => Promise<any>;
    updateWfStep: (wfStep: object) => Promise<any>;
    selectedWfDef: string[];
    setSelectedWfDef: React.Dispatch<React.SetStateAction<string[]>>;
    selectedWfStep: string[];
    setSelectedWfStep: React.Dispatch<React.SetStateAction<string[]>>;
    actionDeleteWfDef: boolean;
    setActionDeleteWfDef: React.Dispatch<React.SetStateAction<boolean>>;
    resultDeleteWfDef: any;
    actionDeleteWfStep: boolean;
    setActionDeleteWfStep: React.Dispatch<React.SetStateAction<boolean>>;
    resultDeleteWfStep: any;
}

export const useWorkflowDefinition = ({
    items,
    loadWfStep,
    updateWfDef,
    selectedWfDef,
    setSelectedWfDef,
    selectedWfStep,
    setSelectedWfStep,
    actionDeleteWfDef,
    setActionDeleteWfDef,
    resultDeleteWfDef,
    actionDeleteWfStep,
    setActionDeleteWfStep,
    resultDeleteWfStep,
}: UseWorkflowDefinitionProps) => {
    const [openRow, setOpenRow] = useState<number | null>(null);
    const [openWorkflowId, setOpenWorkflowId] = useState<string | null>(null);
    const [wfStepsMap, setWfStepsMap] = useState<WorkflowStepType[]>([]);
    const [rows, setRows] = useState<WorkflowDefinitionType[]>([]);
    const [editingRows, setEditingRows] = useState<
        Record<number, WorkflowDefinitionType>
    >({});
    const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({ open: false, message: "", severity: "success" });

    useEffect(() => {
        setOpenRow(null);

        const wfDefData = items.map((item) =>
            renameKeys<WorkflowDefinitionType>(item, wfDefKeyMap)
        );
        setRows(wfDefData);

        setDirtyRows(new Set());
        setEditingRows({});
        setSelectedWfStep([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    useEffect(() => {
        if (actionDeleteWfDef) {
            const res = resultDeleteWfDef;
            const isDeleteSuccess = res?.payload?.dataresponse?.error?.length === 0;

            if (isDeleteSuccess) {
                setSnackbar({
                    open: true,
                    message: "Delete success!",
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message:
                        "Delete failed!\n" + res?.payload?.dataresponse?.error[0]?.info,
                    severity: "error",
                });
                console.error(
                    "Delete failed for WorkflowDef: ",
                    res?.payload?.dataresponse?.error[0]?.info
                );
            }
            setActionDeleteWfDef(false);
        }
    }, [actionDeleteWfDef, resultDeleteWfDef, setActionDeleteWfDef]);

    useEffect(() => {
        if (actionDeleteWfStep) {
            const run = async () => {
                const res = resultDeleteWfStep;
                const isDeleteSuccess = res?.payload?.dataresponse?.error?.length === 0;

                if (isDeleteSuccess) {
                    setSnackbar({
                        open: true,
                        message: "Delete success!",
                        severity: "success",
                    });
                    if (openWorkflowId) {
                        await searchWfStep(openWorkflowId);
                    }
                } else {
                    setSnackbar({
                        open: true,
                        message:
                            "Delete failed!\n" + res?.payload?.dataresponse?.error[0]?.info,
                        severity: "error",
                    });
                    console.error(
                        "Delete failed for WorkflowStep: ",
                        res?.payload?.dataresponse?.error[0]?.info
                    );
                }
                setActionDeleteWfStep(false);
            };

            run();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionDeleteWfStep]);

    const searchWfStep = async (workflowId: string) => {
        const wfStepdata = await loadWfStep(workflowId);
        if (!wfStepdata) {
            setWfStepsMap([]);
            return;
        }
        const wfStepDataMap: WorkflowStepType[] = wfStepdata.map((item) => {
            const renamed = renameKeys<WorkflowStepType>(item, wfStepKeyMap);
            return {
                ...renamed,
                SendingTemplate: safeJsonParseObject(renamed.SendingTemplate),
                MappingResponse: safeJsonParseObject(renamed.MappingResponse),
                SendingCondition: safeJsonParseObject(renamed.SendingCondition),
            };
        });
        setWfStepsMap(wfStepDataMap);
    };

    const handleRowClick = async (index: number, row: WorkflowDefinitionType) => {
        if (openRow === index) {
            setOpenRow(null);
            setOpenWorkflowId(null);
        } else {
            setOpenWorkflowId(row.WorkflowId);
            await searchWfStep(row.WorkflowId);
            setOpenRow(index);
        }
    };

    const handleChange = (
        index: number,
        key: keyof WorkflowDefinitionType,
        val: any
    ) => {
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
            const wfDefSave: WorkflowDefinitionType =
                editingRows[index] ?? rows[index];

            console.log("Save wfdef:", wfDefSave);

            const res = await updateWfDef(wfDefSave);
            const isUpdateSuccess = res?.payload?.dataresponse?.error?.length === 0;

            if (isUpdateSuccess) {
                setDirtyRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });

                setRows((prev) => {
                    const newRows = [...prev];
                    newRows[index] = wfDefSave;
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
            console.error("Error while saving WorkflowDef:", err);
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
        navigator.clipboard.writeText(String(value));
        setSnackbar({
            open: true,
            message: "Copied to clipboard!",
            severity: "success",
        });
    };

    const getRowKey = (row: WorkflowDefinitionType) =>
        `${row.WorkflowId}#${row.ChannelId}`;

    const handleSelectOne = (row: WorkflowDefinitionType) => {
        const id = getRowKey(row);
        setSelectedWfDef((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return {
        openRow,
        rows,
        editingRows,
        dirtyRows,
        snackbar,
        wfStepsMap,
        setSnackbar,
        handleRowClick,
        handleChange,
        handleSave,
        handleCancel,
        handleCopy,
        getRowKey,
        handleSelectOne,
    };
};
