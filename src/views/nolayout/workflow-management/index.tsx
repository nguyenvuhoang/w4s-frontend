"use client";

import { Locale } from "@/configs/i18n";
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
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [inputValue, setInputValue] = useState("");
  const hasSearched = useRef(false);
  const [selectedWfDef, setSelectedWfDef] = useState<string[]>([]);
  const [selectedWfStep, setSelectedWfStep] = useState<string[]>([]);
  const [actionDeleteWfDef, setActionDeleteWfDef] = useState(false);
  const [resultDeleteWfDef, setResultDeleteWfDef] = useState<any>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await workflowService.searchWorkflowDefinition({
      sessiontoken: session?.user?.token as string,
      pageindex: page - 1,
      pagesize: 10,
      searchtext: searchText,
      language: locale as Locale,
    });

    if (res?.payload?.dataresponse?.data) {
      const data = res.payload.dataresponse.data.items;
      const total_count = res.payload.dataresponse.data.total_count || 0;
      const page_size = res.payload.dataresponse.data.page_size || 10;
      setTotalPages(Math.ceil(total_count / page_size));
      setWfDefdataState(data);
    }
    setLoading(false);
  }, [page, searchText, session?.user?.token, locale]);

  useEffect(() => {
    // Skip initial load if we have initialData and haven't searched yet
    if (initialData && page === 1 && searchText === "" && !hasSearched.current) {
      return;
    }
    fetchData();
  }, [fetchData, initialData, page, searchText]);

  const loadWfStep = async (workflowid: string) => {
    setLoading(true);
    try {
      const res = await workflowService.searchWorkflowStepByWorkflowId({
        sessiontoken: session?.user?.token as string,
        pageindex: 0,
        pagesize: 10,
        searchtext: "",
        language: locale as Locale,
        workflowid: workflowid
      });

      let data: any[] = [];
      if (res?.payload?.dataresponse?.data) {
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

  const updateWorkflow = async (wfDef: any, listStep: any[]) => {
    setLoading(true);
    try {
      const res = await workflowService.updateWorkflowDefinition({
        sessiontoken: session?.user?.token as string,
        fields: {
          ...convertKeysToSnakeCase(wfDef),
          list_step: listStep.map(step => convertKeysToSnakeCase(step))
        },
        language: locale as Locale,
      });
      return res;
    } catch (err) {
      console.error("Error updateWorkflow:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWfDef = async () => {
    setLoading(true);
    try {
      const [workflowId, channelId] = selectedWfDef[0].split("#");
      const res = await workflowService.deleteWorkflowDefinition({
        sessiontoken: session?.user?.token as string,
        fields: {
          workflow_id: workflowId,
          channel_id: channelId
        },
        language: locale as Locale,
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

  const handleOpenConfirm = () => {
    setOpenConfirm(true);
  };

  const handleDelete = () => {
    setOpenConfirm(false);
    deleteWfDef();
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
            value={inputValue}
            onChange={(val) => {
              setInputValue(val);
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                hasSearched.current = true;
                setSearchText(inputValue);
                setPage(1);
              }
            }}
            onClear={() => {
              hasSearched.current = true;
              setInputValue("");
              setSearchText("");
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
            onClick={() => handleOpenConfirm()}
          >
            Delete WfDef
          </Button>
        </Stack>
      </Stack>
      <Box sx={{ mt: 5, width: "100%" }}>
        {loading ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
            <Table size="small" sx={{ border: '1px solid #d0d0d0' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48, backgroundColor: '#225087', color: 'white' }}>☐</TableCell>
                  {['Workflow ID', 'Workflow Name', 'Description', 'Status', 'Created Date', 'Modified Date'].map((header, index) => (
                    <TableCell key={`header-${index}`} sx={{ backgroundColor: '#225087', color: 'white', fontWeight: 600 }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(5)].map((_, rowIndex) => (
                  <TableRow key={`skeleton-row-${rowIndex}`}>
                    <TableCell>
                      <Skeleton variant="rectangular" width={20} height={20} />
                    </TableCell>
                    {[...Array(6)].map((_, colIndex) => (
                      <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                        <Skeleton variant="text" width="80%" height={24} animation="wave" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <WorkflowDefinition
            items={wfDefDataState}
            loadWfStep={loadWfStep}
            updateWorkflow={updateWorkflow}
            selectedWfDef={selectedWfDef}
            setSelectedWfDef={setSelectedWfDef}
            selectedWfStep={selectedWfStep}
            setSelectedWfStep={setSelectedWfStep}
            actionDeleteWfDef={actionDeleteWfDef}
            setActionDeleteWfDef={setActionDeleteWfDef}
            resultDeleteWfDef={resultDeleteWfDef}
            actionDeleteWfStep={false}
            setActionDeleteWfStep={() => { }}
            resultDeleteWfStep={null}
          />
        )}
      </Box>
      <Box display="flex" justifyContent="center" my={5}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
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
            Do you want to <strong>delete</strong> the following workflow definition?
          </p>

          <Box sx={{ p: 0, mt: 2 }}>
            {selectedWfDef.map(
              (wf, idx, arr) => {
                const [workflowId, secondField] = wf.split("#");
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
                    ChannelId: <strong>{secondField}</strong>
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
