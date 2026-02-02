import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box
} from "@mui/material";

interface WorkflowStepListProps {
    steps: any[];
}

const WorkflowStepList = ({ steps }: WorkflowStepListProps) => {
    if (!steps || steps.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#225087" }}>
                Existing Workflow Steps
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Step Order</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Step Code</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Service ID</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {steps.map((step) => (
                            <TableRow key={`${step.workflow_id}-${step.step_code}`}>
                                <TableCell>{step.step_order}</TableCell>
                                <TableCell>{step.step_code}</TableCell>
                                <TableCell>{step.description}</TableCell>
                                <TableCell>{step.service_id}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default WorkflowStepList;
