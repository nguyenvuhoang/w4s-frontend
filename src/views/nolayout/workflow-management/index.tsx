"use client";

import SearchInput from "@components/forms/search-input/page";
import { Locale } from "@/configs/i18n";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { workflowService } from "@/servers/system-service";
import { getDictionary } from "@utils/getDictionary";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Pagination,
} from "@mui/material";
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
  // const [jsonView, setJsonView] = useState<{ title: string, content: string } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wfDefDataState, setWfDefdataState] = useState<any[]>(initialData?.items || []);
  // const [wfStepDataState, setWfStepdataState] = useState([]);
  const [totalPages, setTotalPages] = useState(
    Math.ceil((initialData?.total_count || 0) / (initialData?.page_size || 10)) || 1
  );
  // const totalPages = Math.ceil(wfDefDataState.total_count / (wfDefDataState.page_size ?? 10));
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
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

    const res = await workflowService.runBODynamic({
      sessiontoken: session?.user?.token,
      txFo: {
        bo: [
          {
            use_microservice: true,
            input: {
              workflowid: "",
              learn_api: WORKFLOWCODE.WFDEF_SIMPLE_SEARCH,
              fields: {
                searchtext: searchText,
                pageindex: page - 1,
                pagesize: 10,
              },
            },
          },
        ],
      },
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
    console.log("calling loadWfStep with workflowid:", workflowid);

    try {
      const res = await workflowService.runBODynamic({
        sessiontoken: session?.user?.token,
        txFo: {
          bo: [
            {
              use_microservice: true,
              input: {
                workflowid: "",
                learn_api: WORKFLOWCODE.WFSTEP_SEARCH_BY_WORKFLOW_ID,
                fields: { workflowid: workflowid },
              },
            },
          ],
        },
      });

      let data: any[] = [];
      if (res?.payload?.dataresponse.data) {
        data = res.payload.dataresponse.data.items || [];
        console.log("Workflow Step neeee:", data);
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
                fields: { wfdef: wfDef },
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
                fields: { wfstep: wfStep },
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
                fields: { listWfDef: selectedWfDef },
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
                fields: { listWfStep: selectedWfStep },
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
      <Grid container spacing={2} sx={{ my: 5 }}>
        <Grid
          size={{ xs: 12, sm: 6, md: 4 }}
          sx={{ borderColor: "#E0E0E0", borderWidth: 1, borderRadius: 1 }}
        >
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
        </Grid>
        {/* Button Create Workflow Definition */}
        <Grid sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#0B6E47",
              "&:hover": {
                bgcolor: "#095c3bff",
              },
            }}
            onClick={() =>
              window.open("/workflow-management/add-workflow-definition")
            }
          >
            Add WfDef
          </Button>
        </Grid>

        {/* Button Create Workflow Step */}
        <Grid sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#3B3E58",
              "&:hover": {
                bgcolor: "#292c44ff",
              },
            }}
            onClick={() =>
              window.open("/workflow-management/add-workflow-step")
            }
          >
            Add WfStep
          </Button>
        </Grid>
        {/* Button Delte Workflow Def */}
        <Grid sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            disabled={selectedWfDef.length === 0}
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#923458ff",
              "&:hover": {
                bgcolor: "#83264aff",
              },
              "&.Mui-disabled": {
                bgcolor: "#804b5fff",
              },
            }}
            onClick={() => handleOpenConfirm("wfdef")}
          >
            Delete WfDef
          </Button>
        </Grid>
        {/* Button Delte Workflow Step */}
        <Grid sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            disabled={selectedWfStep.length === 0}
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#7b44a0ff",
              "&:hover": {
                bgcolor: "#7431a0ff",
              },
              "&.Mui-disabled": {
                bgcolor: "#7f559bff",
              },
            }}
            onClick={() => handleOpenConfirm("wfstep")}
          >
            Delete WfStep
          </Button>
        </Grid>
      </Grid>
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
          sx={{
            "& .MuiPaginationItem-root": {
              color: "#fff",
              backgroundColor: "#555",
            },
            "& .MuiPaginationItem-root:hover": {
              backgroundColor: "#666",
            },
            "& .MuiPaginationItem-root.Mui-selected": {
              backgroundColor: "#048B47",
              color: "#fff",
            },
          }}
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

