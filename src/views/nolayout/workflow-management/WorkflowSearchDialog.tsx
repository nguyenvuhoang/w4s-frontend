import { Locale } from "@/configs/i18n";
import { workflowService } from "@/servers/system-service";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { Session } from "next-auth";
import { useEffect, useState } from "react";
import { WorkflowDefinitionType } from "./types";
import { getDictionary } from "@/shared/utils/getDictionary";

interface WorkflowSearchDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (workflow: WorkflowDefinitionType) => void;
    session: Session | null;
    locale: Locale;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;

}

const WorkflowSearchDialog = ({
    open,
    onClose,
    onSelect,
    session,
    locale,
    dictionary,
}: WorkflowSearchDialogProps) => {
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [workflows, setWorkflows] = useState<WorkflowDefinitionType[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 5;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await workflowService.searchWorkflowDefinition({
                sessiontoken: session?.user?.token as string,
                pageindex: page - 1,
                pagesize: pageSize,
                searchtext: searchText,
                language: locale,
            });

            if (res?.payload?.dataresponse?.data) {
                const data = res.payload.dataresponse.data.items;
                const total_count = res.payload.dataresponse.data.total_count || 0;
                setTotalPages(Math.ceil(total_count / pageSize));
                setWorkflows(data);
            } else {
                setWorkflows([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error fetching workflows:", error);
            setWorkflows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open, page, searchText]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleRowClick = (row: WorkflowDefinitionType) => {
        onSelect(row);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{dictionary['common'].search} {dictionary['addworkflowdefinition'].title} </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2, mt: 1 }}>
                    <TextField
                        fullWidth
                        placeholder={dictionary['common'].search + ' ' + dictionary['addworkflowdefinition'].title}
                        value={searchText}
                        onChange={handleSearchChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        size="small"
                    />
                </Box>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small" sx={{ minWidth: 500 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '20%' }}>WorkflowId</TableCell>
                                <TableCell sx={{ width: '30%' }}>WorkflowName</TableCell>
                                <TableCell sx={{ width: '50%' }}>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : workflows.length > 0 ? (
                                workflows.map((row) => {
                                    return (
                                        <TableRow
                                            key={row.workflow_id}
                                            hover
                                            onClick={() => handleRowClick(row)}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell>{row.workflow_id}</TableCell>
                                            <TableCell>{row.workflow_name}</TableCell>
                                            <TableCell>{row.description}</TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No workflows found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        size="small"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WorkflowSearchDialog;
