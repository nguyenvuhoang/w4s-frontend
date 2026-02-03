import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ContentCopyTwoToneIcon from "@mui/icons-material/ContentCopyTwoTone";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  alpha,
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
  useTheme,
} from "@mui/material";
import React from "react";
import EditableCell from "./EditableCell";
import { WorkflowDefinitionType, WorkflowStepType } from "./types";
import { useWorkflowDefinition } from "./useWorkflowDefinition";
import WorkflowStepTable from "./WorkflowStepTable";

const WorkflowDefinition = ({
  items,
  loadWfStep,
  updateWorkflow,
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
  updateWorkflow: (wfDef: WorkflowDefinitionType, listStep: WorkflowStepType[]) => Promise<any>;
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
  const theme = useTheme();

  const {
    openRow,
    rows,
    editingRows,
    dirtyRows,
    snackbar,
    wfStepsMap,
    setWfStepsMap,
    setSnackbar,
    handleRowClick,
    handleChange,
    handleSave,
    handleCancel,
    handleCopy,
    getRowKey,
    handleSelectOne,
    openWorkflowId,
  } = useWorkflowDefinition({
    items,
    loadWfStep,
    updateWorkflow,
    selectedWfDef,
    setSelectedWfDef,
    actionDeleteWfDef,
    setActionDeleteWfDef,
    resultDeleteWfDef,
  });

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

  return (
    <Box sx={{ p: 4 }}>
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.primary.dark }}>
              <TableCell sx={{ p: 0, width: "3%" }}>
                {/* Empty header for checkbox */}
              </TableCell>

              <TableCell sx={{ p: 0, width: "3%" }}>
                {/* Empty header for expand icon */}
              </TableCell>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    borderBottom: "none",
                    borderRight: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    py: 1.5
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
                      backgroundColor: theme.palette.background.paper,
                      "& .MuiTableCell-root": {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <TableCell sx={{ p: 0, textAlign: 'center' }}>
                      <Checkbox
                        sx={{
                          "& .MuiTouchRipple-root": {
                            color: theme.palette.primary.light,
                          },
                        }}
                        key={id}
                        checked={selectedWfDef.includes(id)}
                        onChange={() => handleSelectOne(row)}
                        icon={
                          <CheckBoxOutlineBlankIcon
                            sx={{ color: theme.palette.action.active }}
                          />
                        }
                        checkedIcon={
                          <CheckBoxIcon sx={{ color: theme.palette.primary.main }} />
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ p: 0, textAlign: 'center' }}>
                      <IconButton
                        onClick={() => handleRowClick(index, row)}
                        size="small"
                      >
                        {openRow === index ? (
                          <KeyboardArrowUp
                            sx={{
                              color: theme.palette.primary.main,
                              transition: 'transform 0.2s'
                            }}
                          />
                        ) : (
                          <KeyboardArrowDown
                            sx={{
                              color: theme.palette.primary.main,
                              transition: 'transform 0.2s'
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
                            borderRight: `1px solid ${theme.palette.divider}`,
                            position: "relative",
                            "&:hover .action-buttons": {
                              opacity: 1,
                              pointerEvents: "auto",
                            },
                          }}
                        >
                          <EditableCell
                            value={String(value)}
                            onChange={(val) =>
                              handleChange(index, typedKey, val)
                            }
                            disabled={nonEditableFields.includes(typedKey)}
                          />
                          {/* Hover action */}
                          <Box
                            className="action-buttons"
                            sx={{
                              position: "absolute",
                              right: 2,
                              top: "50%",
                              transform: "translateY(-50%)",
                              display: "flex",
                              gap: 0.5,
                              opacity: 0,
                              pointerEvents: "none",
                              transition: "opacity 0.2s",
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: 1,
                              boxShadow: 1
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
                                onClick={() => handleChange(index, typedKey, "")}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {isDirty && (
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell colSpan={columns.length + 2} sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            p: 2,
                            borderTop: `1px dashed ${theme.palette.primary.main}`,
                          }}
                        >
                          <Button
                            onClick={() => handleSave(index)}
                            startIcon={<SaveIcon />}
                            variant="contained"
                            color="primary"
                            size="small"
                          >
                            Save Definition
                          </Button>
                          <Button
                            onClick={() => handleCancel(index)}
                            startIcon={<CancelIcon />}
                            variant="outlined"
                            color="secondary"
                            size="small"
                          >
                            Cancel
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={columns.length + 2} sx={{ p: 0, border: 'none' }}>
                      <Collapse
                        in={openRow === index}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                          backgroundColor: theme.palette.action.hover,
                          mb: 2
                        }}>
                          <WorkflowStepTable
                            steps={wfStepsMap}
                            setWfStepsMap={setWfStepsMap}
                            wfDef={row}
                            updateWorkflow={updateWorkflow}
                          />
                        </Box>
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
