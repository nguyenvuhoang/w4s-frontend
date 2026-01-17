"use client";

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { workflowService } from "@/servers/system-service";
import { getDictionary } from "@/utils/getDictionary";
import ContentWrapper from "@/views/components/layout/content-wrapper";
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
import Grid from "@mui/material/Grid";
import { Session } from "next-auth";
import { useState } from "react";

const AddWorkflowDefinitionContent = ({
  session,
  dictionary,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
}) => {
  interface FormData {
    WorkflowId: string;
    WorkflowName: string;
    Description: string;
    ChannelId: string;
    Status: boolean;
    IsReverse: boolean;
    TimeOut: number;
    TemplateResponse: Record<string, any>;
    WorkflowEvent: string;
  }

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const channels = ["BO", "COREAPI", "MB", "PORTAL", "SMS", "SYS", "TELLERAPP"];
  const [form, setForm] = useState<FormData>({
    WorkflowId: "",
    WorkflowName: "",
    Description: "",
    ChannelId: "BO",
    Status: true,
    IsReverse: false,
    TimeOut: 60000,
    TemplateResponse: {},
    WorkflowEvent: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.WorkflowId || form.WorkflowId.trim() === "") {
      newErrors.WorkflowId = "WorkflowId is required";
    }

    if (!form.ChannelId || form.ChannelId.trim() === "") {
      newErrors.ChannelId = "ChannelId is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // ✅ true = valid, false = có lỗi
  };
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // Xóa lỗi khi người dùng nhập lại
  };
  const handleSave = async (wfDef: object) => {
    try {
      if (validateForm()) {
        console.log("Form valid:", form);
        const res = await createWfDef(wfDef);
        const isInsertSuccess = res?.payload?.dataresponse?.errors?.length === 0;
        console.log("isInsertSuccess:", isInsertSuccess);

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
      console.error("Error while saving WorkflowDefinition:", err);
    }
  };
  const createWfDef = async (wfDef: object) => {
    setLoading(true);
    console.log("calling createWfDef with object:", wfDef);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFDEF_INSERT,
                fields: { wfdef: wfDef },
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
      console.error("Error createWfDef:", err);
    } finally {
      setLoading(false);
    }
  };
  const clearForm = () => {
    setForm({
      WorkflowId: "",
      WorkflowName: "",
      Description: "",
      ChannelId: "BO",
      Status: true,
      IsReverse: false,
      TimeOut: 60000,
      TemplateResponse: {},
      WorkflowEvent: "",
    });
    setSaveSuccess(false);
  };
  return (
    <ContentWrapper
      title={`${dictionary["addworkflowdefinition"].title}`}
      description={dictionary["addworkflowdefinition"].description}
      icon={<SchemaIcon sx={{ fontSize: 40, color: "#225087" }} />}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 5, width: "100%" }}>
        <Paper
          className="p-6 rounded-2xl shadow-md bg-white"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderWidth: "1px", // độ dày viền mặc định
                borderColor: "#e6e6e9", // màu viền bình thường
              },
              "& .MuiInputBase-input": {
                color: "#000000", // màu text khi nhập
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
                  borderColor: "#e6e6e9", // viền khi disable
                },
            }}
          >
            {/* WorkflowId + WorkflowName */}
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
                fullWidth
                label="WorkflowName"
                value={form.WorkflowName}
                onChange={(e) => handleChange("WorkflowName", e.target.value)}
                disabled={saveSuccess}
              />
            </Grid>

            {/* Description + ChannelId */}
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
                    onChange={(e) =>
                      handleChange("IsReverse", e.target.checked)
                    }
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
                onChange={(e) =>
                  handleChange("TimeOut", parseInt(e.target.value) || 0)
                }
                disabled={saveSuccess}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                multiline
                // minRows={6}
                label="WorkflowEvent"
                value={form.WorkflowEvent}
                onChange={(e) => handleChange("WorkflowEvent", e.target.value)}
                disabled={saveSuccess}
              />
            </Grid>

            {/* TemplateResponse (JSON Editor) + Button Save + Clear*/}
            <Grid size={{ xs: 6 }}>
              <FormLabel sx={{ mb: 1, color: "#187329", fontSize: "13px" }}>
                TemplateResponse
              </FormLabel>
              <JsonEditorComponent
                initialJson={JSON.parse(
                  JSON.stringify(form.TemplateResponse ?? {})
                )}
                onChange={(newJson) =>
                  handleChange("TemplateResponse", newJson)
                }
                height="300px"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
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

export default AddWorkflowDefinitionContent;
