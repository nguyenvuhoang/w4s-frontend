import JsonEditorComponent from "@/@core/components/jSONEditor";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import ContentCopyTwoToneIcon from "@mui/icons-material/ContentCopyTwoTone";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";

const CELL_BG = "#3B3E58";
const TEXT_COLOR = "#fff";
const BORDER_COLOR = "#444";

const EditableCell = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [editingValue, setEditingValue] = useState(value);

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
      <TextField
        variant="standard"
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        slotProps={{
          htmlInput: {
            style: {
              color: TEXT_COLOR,
              fontWeight: 500,
              backgroundColor: CELL_BG,
            },
          },
        }}
        sx={{
          "& .MuiInputBase-input": {
            color: TEXT_COLOR,
            fontWeight: 500,
            backgroundColor: CELL_BG,
          },
          "& .MuiInput-underline:before, & .MuiInput-underline:after": {
            borderBottom: "none",
          },
          "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
            borderBottom: "none",
          },
        }}
        fullWidth
      />
    </Box>
  );
};

export type WorkflowDefinitionType = {
  WorkflowId: string;
  WorkflowName: string;
  Description: string;
  ChannelId: string;
  Status: string;
  TemplateResponse: string;
  WorkflowEvent: string;
};

export type WorkflowStepType = {
  WorkflowId: string;
  StepOrder: number;
  StepCode: string;
  ServiceId: string;
  Status: string;
  Description: string;
  SendingTemplate: Record<string, any>;
  MappingResponse: Record<string, any>;
  SendingCondition: Record<string, any>;
  ProcessingNumber: number;
};

const wfDefKeyMap: Record<string, keyof WorkflowDefinitionType> = {
  workflow_id: "WorkflowId",
  workflow_name: "WorkflowName",
  description: "Description",
  channel_id: "ChannelId",
  status: "Status",
  template_response: "TemplateResponse",
  workflow_event: "WorkflowEvent",
};

const wfStepKeyMap: Record<string, keyof WorkflowStepType> = {
  workflow_id: "WorkflowId",
  step_order: "StepOrder",
  step_code: "StepCode",
  service_id: "ServiceId",
  status: "Status",
  description: "Description",
  sending_template: "SendingTemplate",
  mapping_response: "MappingResponse",
  sending_condition: "SendingCondition",
  processing_number: "ProcessingNumber",
};

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

function StepTable({
  steps,
  updateWfStep,
  selectedWfStep,
  setSelectedWfStep,
}: {
  steps: WorkflowStepType[];
  updateWfStep: (wfStep: object) => Promise<any>;
  selectedWfStep: string[];
  setSelectedWfStep: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [rows, setRows] = useState(steps);
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
  const handleChange = (index: number, key: string, val: any) => {
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
      // Lấy dữ liệu hiện tại (nếu có editingRows thì nên merge từ đó)
      const wfStepSave: WorkflowStepType = editingRows[index] ?? rows[index];

      console.log("Save WorkflowStep:", wfStepSave);

      // Gọi API update
      const res = await updateWfStep(wfStepSave);
      const isUpdateSuccess = res?.payload?.dataresponse?.error?.length === 0;
      console.log("isUpdateSuccess:", isUpdateSuccess);

      if (isUpdateSuccess) {
        // Nếu update thành công -> xóa dirty flag
        setDirtyRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });

        // Đồng bộ editingRows về rows
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
        console.error(
          "Update failed for WorkflowStep: ",
          res?.payload?.dataresponse?.error[0]?.info
        );
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
      newEditing[index] = steps[index];
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

  const getRowKey = (row: any) => `${row.WorkflowId}#${row.StepCode}#${row.StepOrder}`;

  const handleSelectOne = (row: any) => {
    const id = getRowKey(row);
    setSelectedWfStep((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Box sx={{ p: 1, backgroundColor: "#32344A" }}>
      {steps.map((step, index) => {
        const isDirty = dirtyRows.has(index);
        const id = getRowKey(step);
        return (
          <Paper
            key={index}
            sx={{
              m: 4,
              backgroundColor: CELL_BG,
              borderRadius: 2,
              userSelect: "none",
            }}
          >
            <Table size="small" sx={{ width: "100%" }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ p: 0, borderBottom: "none" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        marginLeft: 2,
                      }}
                    >
                      <Checkbox
                        sx={{
                          "& .MuiTouchRipple-root": {
                            color: "#F9E79F",
                          },
                        }}
                        key={id}
                        checked={selectedWfStep.includes(id)}
                        onChange={() => handleSelectOne(step)}
                        icon={
                          <CheckBoxOutlineBlankIcon sx={{ color: "#F9E79F" }} />
                        }
                        checkedIcon={<CheckBoxIcon sx={{ color: "#F9E79F" }} />}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
                {Object.entries(step).map(([key, value]) => {
                  const typedKey = key as keyof WorkflowStepType;
                  return (
                    <TableRow
                      key={key}
                      sx={{
                        borderBottom: "2px solid #50526C", // màu xám nhạt, nhìn rõ trên nền tối
                        "&:last-child": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          width: 400,
                          fontWeight: 600,
                          color: TEXT_COLOR,
                          borderBottom: "none",
                        }}
                      >
                        {key}
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "calc(100% - 400px)",
                          position: "relative",
                          "&:hover .action-buttons": {
                            opacity: 1,
                            pointerEvents: "auto",
                          },
                          borderBottom: "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {[
                            "SendingTemplate",
                            "MappingResponse",
                            "SendingCondition",
                          ].includes(key) ? (
                            <Box sx={{ width: "95%" }}>
                              <JsonEditorComponent
                                initialJson={JSON.parse(
                                  JSON.stringify(
                                    editingRows[index]?.[typedKey] ??
                                      rows[index][typedKey] ??
                                      {}
                                  )
                                )}
                                onChange={(newJson) =>
                                  handleChange(index, typedKey, newJson)
                                }
                                height="300px"
                              />
                            </Box>
                          ) : (
                            <TextField
                              variant="standard"
                              value={
                                typeof value === "object"
                                  ? null
                                  : String(
                                      editingRows[index]?.[typedKey] ??
                                        rows[index][typedKey] ??
                                        ""
                                    )
                              }
                              onChange={(e) =>
                                handleChange(index, typedKey, e.target.value)
                              }
                              fullWidth
                              disabled={nonEditableFields.includes(typedKey)}
                              slotProps={{
                                input: {
                                  sx: {
                                    color: TEXT_COLOR,
                                    backgroundColor: CELL_BG,

                                    "&:before": {
                                      borderBottom: "none !important",
                                    },
                                    "&:after": {
                                      borderBottom: "none !important",
                                    },
                                    "&:hover:not(.Mui-disabled, .Mui-error):before":
                                      {
                                        borderBottom: "none !important",
                                      },

                                    "& .MuiInputBase-input.Mui-disabled": {
                                      WebkitTextFillColor: TEXT_COLOR,
                                      color: TEXT_COLOR,
                                      opacity: 1,
                                    },
                                  },
                                },
                              }}
                            />
                          )}
                        </Box>

                        {/* Nút action hiển thị khi hover */}
                        <Box
                          className="action-buttons"
                          sx={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            gap: 1,
                            opacity: 0,
                            pointerEvents: "none",
                            transition: "opacity 0.2s",
                            backgroundColor: CELL_BG,
                          }}
                        >
                          <IconButton
                            size="small"
                            sx={{ color: "#90caf9" }}
                            onClick={() => handleCopy(value)}
                          >
                            <ContentCopyTwoToneIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: "#f44336" }}
                            onClick={() =>
                              handleChange(
                                index,
                                key,
                                typeof value === "object" ? {} : ""
                              )
                            }
                            disabled={nonEditableFields.includes(typedKey)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
                  p: 4,
                  borderTop: "2px solid #50526C",
                }}
              >
                <Button
                  onClick={() => handleSave(index)}
                  startIcon={<SaveIcon />}
                  variant="contained"
                  color="primary"
                >
                  Save change
                </Button>
                <Button
                  onClick={() => handleCancel(index)}
                  startIcon={<CancelIcon />}
                  variant="contained"
                  color="secondary"
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Paper>
        );
      })}
      {/* Snackbar thông báo */}
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
}

const WorkflowDefinition = ({
  items,
  loadWfStep,
  updateWfDef,
  updateWfStep,
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
}: {
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
}) => {
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

  const nonEditableFields: (keyof WorkflowDefinitionType)[] = [
    "WorkflowId",
    "ChannelId",
  ];

  const columns = [
    { key: "WorkflowId", label: "WorkflowId", width: 350 },
    { key: "WorkflowName", label: "WorkflowName", width: 200 },
    { key: "Description", label: "Description", width: 200 },
    { key: "ChannelId", label: "ChannelId", width: 150 },
    { key: "Status", label: "Status", width: 100 },
    { key: "TemplateResponse", label: "TemplateResponse", width: 200 },
    { key: "WorkflowEvent", label: "WorkflowEvent", width: 200 },
  ];

  useEffect(() => {
    setOpenRow(null);

    const wfDefData = items.map((item) =>
      renameKeys<WorkflowDefinitionType>(item, wfDefKeyMap)
    );
    setRows(wfDefData);

    setDirtyRows(new Set());
    setEditingRows({});
    //setSelectedWfDef([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionDeleteWfDef]);

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
          await searchWfStep(openWorkflowId!);
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
    // setWfStepsMap({ ...wfStepDataMap });
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
      console.log("isUpdateSuccess:", isUpdateSuccess);

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
        console.error(
          "Update failed for WorkflowDef: ",
          res?.payload?.dataresponse?.error[0]?.info
        );
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

  const getRowKey = (row: any) => `${row.WorkflowId}#${row.ChannelId}`;

  // const currentPageIds = rows.map((r) => getRowKey(r));
  // const isAllSelected = currentPageIds.every((id) =>
  //   selectedWfDef.includes(id)
  // );

  // const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.checked) {
  //     setSelectedWfDef((prev) => [...new Set([...prev, ...currentPageIds])]);
  //   } else {
  //     setSelectedWfDef((prev) =>
  //       prev.filter((id) => !currentPageIds.includes(id))
  //     );
  //   }
  // };

  const handleSelectOne = (row: any) => {
    const id = getRowKey(row);
    setSelectedWfDef((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <TableContainer component={Paper}>
        <Table sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#0A6F47" }}>
              <TableCell sx={{ p: 0, width: "3%" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                </Box>
              </TableCell>

              <TableCell sx={{ p: 0, width: "2%" }} />
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    color: TEXT_COLOR,
                    fontWeight: 600,
                    borderBottom: "none",
                    borderRight: "2px solid #50526C",
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const isDirty = dirtyRows.has(index);
              const id = getRowKey(row);
              return (
                <React.Fragment key={index}>
                  <TableRow
                    sx={{
                      backgroundColor: CELL_BG,
                      "& .MuiTableCell-root": {
                        borderBottom: "2px solid #50526C",
                      },
                    }}
                  >
                    <TableCell sx={{ p: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "flex-end",
                        }}
                      >
                        <Checkbox
                          sx={{
                            "& .MuiTouchRipple-root": {
                              color: "#F9E79F",
                            },
                          }}
                          key={id}
                          checked={selectedWfDef.includes(id)}
                          onChange={() => handleSelectOne(row)}
                          icon={
                            <CheckBoxOutlineBlankIcon
                              sx={{ color: "#F9E79F" }}
                            />
                          }
                          checkedIcon={
                            <CheckBoxIcon sx={{ color: "#F9E79F" }} />
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ p: 0 }}>
                      <IconButton
                        onClick={async () => {
                          if (openRow === index) {
                            setOpenRow(null);
                            setOpenWorkflowId(null);
                          } else {
                            setOpenWorkflowId(row.WorkflowId);
                            await searchWfStep(row.WorkflowId);
                            setOpenRow(index);
                          }
                        }}
                      >
                        {openRow === index ? (
                          <KeyboardArrowUp
                            sx={{
                              "& path": {
                                fill: "#F9E79F",
                              },
                            }}
                          />
                        ) : (
                          <KeyboardArrowDown
                            sx={{
                              "& path": {
                                fill: "#F9E79F",
                              },
                            }}
                          />
                        )}
                      </IconButton>
                    </TableCell>
                    {columns.map((col) => {
                      const typedKey = col.key as keyof WorkflowDefinitionType;
                      const value =
                        editingRows[index]?.[typedKey] ?? row[typedKey] ?? "";
                      return (
                        <TableCell
                          key={col.key}
                          sx={{
                            borderRight: "2px solid #50526C",

                            position: "relative",
                            "&:hover .action-buttons": {
                              opacity: 1,
                              pointerEvents: "auto",
                            },
                          }}
                        >
                          <TextField
                            variant="standard"
                            value={String(value)}
                            onChange={(e) =>
                              handleChange(index, typedKey, e.target.value)
                            }
                            fullWidth
                            disabled={nonEditableFields.includes(typedKey)}
                            slotProps={{
                              input: {
                                sx: {
                                  color: TEXT_COLOR,
                                  backgroundColor: CELL_BG,
                                  "&:before": {
                                    borderBottom: "none !important",
                                  },
                                  "&:after": {
                                    borderBottom: "none !important",
                                  },
                                  "& .MuiInputBase-input.Mui-disabled": {
                                    color: TEXT_COLOR,
                                    WebkitTextFillColor: TEXT_COLOR,
                                    opacity: 1,
                                  },
                                },
                              },
                            }}
                          />
                          {/* Hover action */}
                          <Box
                            className="action-buttons"
                            sx={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              display: "flex",
                              gap: 1,
                              opacity: 0,
                              pointerEvents: "none",
                              transition: "opacity 0.2s",
                              backgroundColor: CELL_BG,
                            }}
                          >
                            <IconButton
                              size="small"
                              sx={{ color: "#90caf9" }}
                              onClick={() => handleCopy(value)}
                            >
                              <ContentCopyTwoToneIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              sx={{ color: "#f44336" }}
                              onClick={() => handleChange(index, typedKey, "")}
                              disabled={nonEditableFields.includes(typedKey)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {isDirty && (
                    <TableRow sx={{ backgroundColor: "#30334E" }}>
                      <TableCell colSpan={columns.length + 2}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            p: 1,
                          }}
                        >
                          <Button
                            onClick={() => handleSave(index)}
                            startIcon={<SaveIcon />}
                            variant="contained"
                            color="primary"
                          >
                            Save change
                          </Button>
                          <Button
                            onClick={() => handleCancel(index)}
                            startIcon={<CancelIcon />}
                            variant="contained"
                            color="secondary"
                          >
                            Cancel
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow
                    sx={{
                      backgroundColor: "#50526C",
                    }}
                  >
                    <TableCell
                      colSpan={columns.length + 2}
                      sx={{ p: 0, borderBottom: "none" }}
                    >
                      <Collapse
                        in={openRow === index}
                        timeout="auto"
                        unmountOnExit
                      >
                        <StepTable
                          steps={wfStepsMap}
                          updateWfStep={updateWfStep}
                          selectedWfStep={selectedWfStep}
                          setSelectedWfStep={setSelectedWfStep}
                        />
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Snackbar */}
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

export default WorkflowDefinition;
