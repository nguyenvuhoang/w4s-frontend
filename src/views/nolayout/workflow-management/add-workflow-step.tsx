"use client";

import { getDictionary } from "@utils/getDictionary";
import ContentWrapper from "@features/dynamicform/components/layout/content-wrapper";
import SchemaIcon from "@mui/icons-material/Schema";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Paper,
  Snackbar,
  Switch,
  TextField,
} from "@mui/material";
import { Session } from "next-auth";
import { useState } from "react";
import { workflowService } from "@/servers/system-service";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import Grid from "@mui/material/Grid";
import JsonEditorComponent from "@/@core/components/jSONEditor";
import { Label } from "recharts";
import { set } from "lodash";

const AddWorkflowStepContent = ({
  session,
  dictionary,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
}) => {
  interface FormData {
    WorkflowId: string;
    StepCode: string;
    StepOrder: number;
    ServiceId: string;
    Status: boolean;
    Description: string;
    SendingTemplate: Record<string, any>;
    MappingResponse: Record<string, any>;
    StepTimeOut: number;
    SendingCondition: Record<string, any>;
    ProcessingNumber: number;
    IsReverse: boolean;
    ShouldAwaitStep: boolean;
    SubSendingTemplate: Record<string, any>;
  }

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const services = ["CBG", "CMS", "CTH", "DTS", "NCH", "RPT", "STL", "LOG"];
  const [form, setForm] = useState<FormData>({
    WorkflowId: "",
    StepCode: "",
    StepOrder: 1,
    ServiceId: "CBG",
    Status: true,
    Description: "",
    SendingTemplate: {},
    MappingResponse: {},
    StepTimeOut: 60000,
    SendingCondition: {},
    ProcessingNumber: 0,
    IsReverse: false,
    ShouldAwaitStep: true,
    SubSendingTemplate: {},
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.WorkflowId || form.WorkflowId.trim() === "") {
      newErrors.WorkflowId = "WorkflowId is required";
    }

    if (!form.StepCode || form.StepCode.trim() === "") {
      newErrors.StepCode = "StepCode is required";
    }

    if (!form.StepOrder || form.StepOrder < 1) {
      newErrors.StepOrder = "StepOrder must be greater than 0";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // âœ… true = valid, false = cÃ³ lá»—i
  };

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // XÃ³a lá»—i khi ngÆ°á»i dÃ¹ng nháº­p láº¡i
  };
  const handleSave = async (wfStep: object) => {
    try {
      if (validateForm()) {
        const res = await createWfStep(wfStep);
        const isInsertSuccess = res?.payload?.dataresponse?.errors?.length === 0;

        if (isInsertSuccess) {
          setSnackbar({
            open: true,
            message: "Add success!",
            severity: "success",
          });
          setSaveSuccess(true);
        } else {
          setSnackbar({
            open: true,
            message:
              "Add failed!\n" + res?.payload?.dataresponse?.errors[0]?.info,
            severity: "error",
          });
          console.error(
            "Add failed for WorkflowStep: ",
            res?.payload?.dataresponse?.errors[0]?.info
          );
        }
      } else {
        console.log("Form invalid:", errors);
        setSnackbar({
          open: true,
          message: "Missing require data!",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Add failed!", severity: "error" });
      console.error("Error while saving WorkflowStep:", err);
    }
  };
  const createWfStep = async (wfStep: object) => {
    setLoading(true);
    console.log("calling createWfStep with object:", wfStep);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFSTEP_INSERT,
                fields: { wfstep: wfStep },
              },
            },
          ],
        },
      });
      console.log("res: ", res);
      return res;
      // if (res?.payload?.dataresponse?.error?.length === 0) {
      //   return true;
      // }
      // return false;
    } catch (err) {
      console.error("Error createWfStep:", err);
    } finally {
      setLoading(false);
    }
  };
  const clearForm = () => {
    setForm({
      WorkflowId: "",
      StepCode: "",
      StepOrder: 1,
      ServiceId: "CBG",
      Status: true,
      Description: "",
      SendingTemplate: {},
      MappingResponse: {},
      StepTimeOut: 60000,
      SendingCondition: {},
      ProcessingNumber: 0,
      IsReverse: false,
      ShouldAwaitStep: true,
      SubSendingTemplate: {},
    });
    setSaveSuccess(false);
  };
  return (
    <ContentWrapper
      title={`${dictionary["addworkflowstep"].title}`}
      description={dictionary["addworkflowstep"].description}
      icon={<SchemaIcon sx={{ fontSize: 40, color: "#225087" }} />}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 5, width: "100%" }}>
        <Paper
          className="p-6 rounded-2xl shadow-md bg-white"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderWidth: "1px", // Ä‘á»™ dÃ y viá»n máº·c Ä‘á»‹nh
                borderColor: "#e6e6e9", // mÃ u viá»n bÃ¬nh thÆ°á»ng
              },
              "& .MuiInputBase-input": {
                color: "#000000", // mÃ u text khi nháº­p
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
              "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "#e6e6e9", // viá»n khi disable
                },
            }}
          >
            {/* WorkflowId + StepCode */}
            <Grid size={{ xs: 6 }}>
              <TextField
                required
                fullWidth
                label="WorkflowId"
                value={form.WorkflowId}
                onChange={(e) => handleChange("WorkflowId", e.target.value)}
                error={!!errors.WorkflowId}
                helperText={errors.WorkflowId}
                disabled={saveSuccess}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                required
                fullWidth
                label="StepCode"
                value={form.StepCode}
                onChange={(e) => handleChange("StepCode", e.target.value)}
                error={!!errors.StepCode}
                helperText={errors.StepCode}
                disabled={saveSuccess}
              />
            </Grid>

            {/* Description + ServiceId */}
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Description"
                value={form.Description}
                onChange={(e) => handleChange("Description", e.target.value)}
                disabled={saveSuccess}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                select
                fullWidth
                label="ServiceId"
                value={form.ServiceId}
                onChange={(e) => handleChange("ServiceId", e.target.value)}
                disabled={saveSuccess}
              >
                {services.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* StepOrder + ProcessingNumber */}
            <Grid size={{ xs: 6 }}>
              <TextField
                required
                fullWidth
                type="number"
                label="StepOrder"
                value={form.StepOrder}
                onChange={(e) =>
                  handleChange("StepOrder", parseInt(e.target.value) || 1)
                }
                disabled={saveSuccess}
                error={!!errors.StepOrder}
                helperText={errors.StepOrder}
                slotProps={{
                  input: {
                    inputProps: { min: 1 },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="ProcessingNumber"
                value={form.ProcessingNumber}
                onChange={(e) =>
                  handleChange(
                    "ProcessingNumber",
                    parseInt(e.target.value) || 0
                  )
                }
                disabled={saveSuccess}
                slotProps={{
                  input: {
                    inputProps: { min: 0 },
                  },
                }}
              />
            </Grid>

            {/* Status + IsReverse + ShouldAwaitStep + TimeOut*/}
            <Grid size={{ xs: 2 }}>
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
            <Grid size={{ xs: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.IsReverse}
                    onChange={(e) =>
                      handleChange("IsReverse", e.target.checked)
                    }
                  />
                }
                label="IsReverse"
                disabled={saveSuccess}
              />
            </Grid>
            <Grid size={{ xs: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.ShouldAwaitStep}
                    onChange={(e) =>
                      handleChange("ShouldAwaitStep", e.target.checked)
                    }
                  />
                }
                label="ShouldAwaitStep"
                disabled={saveSuccess}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="StepTimeOut (ms)"
                value={form.StepTimeOut}
                onChange={(e) =>
                  handleChange("StepTimeOut", parseInt(e.target.value) || 0)
                }
                disabled={saveSuccess}
              />
            </Grid>
            {/* SendingTemplate (JSON Editor) + MappingResponse (JSON Editor) */}
            <Grid size={{ xs: 6 }}>
              <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>
                SendingTemplate
              </FormLabel>
              <JsonEditorComponent
                initialJson={JSON.parse(
                  JSON.stringify(form.SendingTemplate ?? {})
                )}
                onChange={(newJson) => handleChange("SendingTemplate", newJson)}
                height="300px"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>
                MappingResponse
              </FormLabel>
              <JsonEditorComponent
                initialJson={JSON.parse(
                  JSON.stringify(form.MappingResponse ?? {})
                )}
                onChange={(newJson) => handleChange("MappingResponse", newJson)}
                height="300px"
              />
            </Grid>
            {/* SendingCondition (JSON Editor) + SubSendingTemplate (JSON Editor) */}
            <Grid size={{ xs: 6 }}>
              <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>
                SendingCondition
              </FormLabel>
              <JsonEditorComponent
                initialJson={JSON.parse(
                  JSON.stringify(form.SendingCondition ?? {})
                )}
                onChange={(newJson) =>
                  handleChange("SendingCondition", newJson)
                }
                height="300px"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>
                SubSendingTemplate
              </FormLabel>
              <JsonEditorComponent
                initialJson={JSON.parse(
                  JSON.stringify(form.SubSendingTemplate ?? {})
                )}
                onChange={(newJson) =>
                  handleChange("SubSendingTemplate", newJson)
                }
                height="300px"
              />
            </Grid>
            {/* Button Save + Clear */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "end",
                  height: "100%",
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSave(form)}
                  sx={{ mr: 5, px: 10, py: 2 }}
                  disabled={saveSuccess}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ mr: 0, px: 10, py: 2 }}
                  onClick={() => clearForm()}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
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
    </ContentWrapper>
  );
};

export default AddWorkflowStepContent;

