"use client";

import { Locale } from "@/configs/i18n";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { workflowService } from "@/servers/system-service";
import { convertKeysToSnakeCase } from "@/shared/utils/convertKeysToSnakeCase";
import { getLocalizedUrl } from "@/shared/utils/i18n";
import SearchInput from "@components/forms/search-input/page";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
  Stack,
  useTheme
} from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import WorkflowDefinition from "./workflow-definition";

interface WorkflowInitialData {
  items?: any[];
  total_count?: number;
  page_size?: number;
}

const WorkflowManagementContent = ({
  session,
  dictionary,
  locale,
  initialData,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  locale?: Locale;
  initialData?: WorkflowInitialData;
}) => {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wfDefDataState, setWfDefdataState] = useState<any[]>(initialData?.items || []);
  const [totalPages, setTotalPages] = useState(
    Math.ceil((initialData?.total_count || 0) / (initialData?.page_size || 10)) || 1
  );
  const [searchText, setSearchText] = useState("");
  const [selectedWfDef, setSelectedWfDef] = useState<string[]>([]);
  const [selectedWfStep, setSelectedWfStep] = useState<string[]>([]);
  const [actionDeleteWfDef, setActionDeleteWfDef] = useState(false);
  const [resultDeleteWfDef, setResultDeleteWfDef] = useState<any>(null);
  const [actionDeleteWfStep, setActionDeleteWfStep] = useState(false);
  const [resultDeleteWfStep, setResultDeleteWfStep] = useState<any>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<"wfdef" | "wfstep" | null>(null);

  const fetchData = useCallback(async () => {
    console.log("pageeeee: ", page);
    setLoading(true);
    console.log(
      "calling fetchData with page:",
      page,
      "searchText:",
      searchText
    );

    const res = await workflowService.searchWorkflowDefinition({
      sessiontoken: session?.user?.token as string,
      pageindex: page - 1,
      pagesize: 10,
      searchtext: searchText,
      language: locale as Locale,
    });

    if (res?.payload?.dataresponse?.data) {
      const data = res.payload.dataresponse.data.items;
      console.log("Workflow Data:", data);
      const total_count = res.payload.dataresponse.data.total_count || 0;
      const page_size = res.payload.dataresponse.data.page_size || 10;
      setTotalPages(Math.ceil(total_count / page_size));
      setWfDefdataState(data);
    }
    setLoading(false);
  }, [page, searchText, session?.user?.token]);

  useEffect(() => {
    // Skip initial fetch if we have initialData and it's the first page with no search
    if (initialData && page === 1 && searchText === "") {
      return;
    }
    fetchData();
  }, [fetchData, initialData, page, searchText]);

  const loadWfStep = async (workflowid: string) => {
    setLoading(true);

    try {
      const res = await workflowService.searchWorkflowStepByWorkflowId({
        sessiontoken: session?.user?.token as string,
        pageindex: page - 1,
        pagesize: 10,
        searchtext: searchText,
        language: locale as Locale,
        workflowid: workflowid
      });

      let data: any[] = [];
      if (res?.payload?.dataresponse.data) {
        data = res.payload.dataresponse.data.items || [];
      }

      return data;
    } catch (err) {
      console.error("Error loadWfStep:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateWfDef = async (wfDef: object) => {
    setLoading(true);
    console.log("calling updateWfDef with object:", wfDef);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFDEF_UPDATE,
                fields: { wfdef: convertKeysToSnakeCase(wfDef) },
              },
            },
          ],
        },
      });
      console.log("res: ", res);
      return res;
    } catch (err) {
      console.error("Error updateWfDef:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateWfStep = async (wfStep: object) => {
    setLoading(true);
    console.log("calling updateWfStep with object:", wfStep);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFSTEP_UPDATE,
                fields: { wfstep: convertKeysToSnakeCase(wfStep) },
              },
            },
          ],
        },
      });
      console.log("res: ", res);
      return res;
    } catch (err) {
      console.error("Error updateWfStep:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWfDef = async () => {
    setLoading(true);
    console.log("selected wfDef to delete:", selectedWfDef);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFDEF_DELETE,
                fields: { listWfDef: convertKeysToSnakeCase(selectedWfDef) },
              },
            },
          ],
        },
      });
      setResultDeleteWfDef(res);
      setActionDeleteWfDef(true);

      const isDeleteSuccess = res?.payload?.dataresponse?.errors?.length === 0;
      if (isDeleteSuccess) {
        setSelectedWfDef([]);
        fetchData();
      }
    } catch (err) {
      console.error("Error delete WfDef:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWfStep = async () => {
    setLoading(true);
    console.log("selected wfStep to delete:", selectedWfStep);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFSTEP_DELETE,
                fields: { listWfStep: convertKeysToSnakeCase(selectedWfStep) },
              },
            },
          ],
        },
      });
      setResultDeleteWfStep(res);
      setActionDeleteWfStep(true);

      const isDeleteSuccess = res?.payload?.dataresponse?.errors?.length === 0;
      if (isDeleteSuccess) {
        setSelectedWfStep([]);
      }
    } catch (err) {
      console.error("Error delete WfStep:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = (type: "wfdef" | "wfstep") => {
    setDeleteType(type);
    setOpenConfirm(true);
  };

  const handleDelete = () => {
    setOpenConfirm(false);
    if (deleteType === "wfdef") {
      deleteWfDef();
    } else if (deleteType === "wfstep") {
      deleteWfStep();
    }
  };
  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ my: 3, alignItems: "center", justifyContent: "space-between" }}
      >
        <Box sx={{ width: { xs: "100%", md: 400 } }}>
          <SearchInput
            fullWidth
            size="small"
            variant="outlined"
            label={dictionary["common"].search || "Search Workflow"}
            placeholder="Enter workflow code"
            value={searchText}
            onChange={(val) => {
              setSearchText(val);
              setPage(1);
            }}
          />
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() =>
              window.open(getLocalizedUrl("/workflow-management/add", locale as string))
            }
          >
            Add Workflow
          </Button>

          <Button
            disabled={selectedWfDef.length === 0}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleOpenConfirm("wfdef")}
          >
            Delete WfDef
          </Button>

          <Button
            disabled={selectedWfStep.length === 0}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleOpenConfirm("wfstep")}
          >
            Delete WfStep
          </Button>
        </Stack>
      </Stack>
      <Box sx={{ mt: 5, width: "100%" }}>
        <WorkflowDefinition
          items={wfDefDataState}
          loadWfStep={loadWfStep}
          updateWfDef={updateWfDef}
          updateWfStep={updateWfStep}
          selectedWfDef={selectedWfDef}
          setSelectedWfDef={setSelectedWfDef}
          selectedWfStep={selectedWfStep}
          setSelectedWfStep={setSelectedWfStep}
          actionDeleteWfDef={actionDeleteWfDef}
          setActionDeleteWfDef={setActionDeleteWfDef}
          resultDeleteWfDef={resultDeleteWfDef}
          actionDeleteWfStep={actionDeleteWfStep}
          setActionDeleteWfStep={setActionDeleteWfStep}
          resultDeleteWfStep={resultDeleteWfStep}
        />
      </Box>
      <Box display="flex" justifyContent="center" my={5}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
        /* Remove custom styling to let theme control it, or keep minimal if needed */
        />
      </Box>
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle
          sx={{
            backgroundColor: "#fff",
            color: "#000",
            borderBottom: "1px solid #000",
          }}
        >
          Confirm Delete
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            backgroundColor: "#fff",
            color: "#000",
            borderBottom: "1px solid #000",
          }}
        >
          <p>
            Do you want to <strong>delete</strong> the following{" "}
            {deleteType === "wfdef" ? "workflow definition" : "workflow step"}?
          </p>

          <Box sx={{ p: 0, mt: 2 }}>
            {(deleteType === "wfdef" ? selectedWfDef : selectedWfStep).map(
              (wf, idx, arr) => {
                const [workflowId, secondField, thirdField] = wf.split("#");
                const isLast = idx === arr.length - 1;
                return (
                  <Box
                    key={idx}
                    sx={{
                      mb: 1,
                      borderBottom: isLast ? "none" : "1px solid #ccc",
                    }}
                  >
                    WorkflowId: <strong>{workflowId}</strong>
                    <br />
                    {deleteType === "wfdef" ? (
                      <>
                        ChannelId: <strong>{secondField}</strong>
                      </>
                    ) : (
                      <>
                        StepCode: <strong>{secondField}</strong>
                        <br />
                        StepOrder: <strong>{thirdField}</strong>
                      </>
                    )}
                  </Box>
                );
              }
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            alignItems: "center",
            py: 0,
            backgroundColor: "#fff",
            color: "#000",
          }}
        >
          <Button
            color="warning"
            variant="text"
            onClick={() => setOpenConfirm(false)}
          >
            Cancel
          </Button>
          <Button color="error" variant="text" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WorkflowManagementContent;

