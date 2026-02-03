import { Locale } from "@/configs/i18n";
import { workflowService } from "@/servers/system-service";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Pagination,
    Paper,
    Skeleton,
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
    const [inputValue, setInputValue] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [workflows, setWorkflows] = useState<WorkflowDefinitionType[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        if (!open) return;

        let active = true;

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

                if (active) {
                    if (res?.payload?.dataresponse?.data) {
                        const data = res.payload.dataresponse.data.items;
                        const total_count = res.payload.dataresponse.data.total_count || 0;
                        setTotalPages(Math.ceil(total_count / pageSize));
                        setWorkflows(data);
                    } else {
                        setWorkflows([]);
                        setTotalPages(1);
                    }
                }
            } catch (error) {
                console.error("Error fetching workflows:", error);
                if (active) {
                    setWorkflows([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            active = false;
        };
    }, [open, page, searchText]);

    const triggerSearch = () => {
        if (inputValue !== searchText) {
            setSearchText(inputValue);
            setPage(1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            triggerSearch();
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleClearSearch = () => {
        setInputValue("");
        setSearchText("");
        setPage(1);
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
                        value={inputValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton onClick={triggerSearch} size="small" edge="start">
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                endAdornment: inputValue && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleClearSearch}
                                            onMouseDown={(e) => e.preventDefault()}
                                            edge="end"
                                            size="small"
                                        >
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
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
                                [...Array(5)].map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        <TableCell><Skeleton variant="text" width="80%" animation="wave" /></TableCell>
                                        <TableCell><Skeleton variant="text" width="80%" animation="wave" /></TableCell>
                                        <TableCell><Skeleton variant="text" width="80%" animation="wave" /></TableCell>
                                    </TableRow>
                                ))
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
