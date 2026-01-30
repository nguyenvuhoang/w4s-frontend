'use client';

import { DataGrid, DataGridProps } from '@mui/x-data-grid';

type CustomDataGridProps = DataGridProps;

const CustomDataGrid = (props: CustomDataGridProps) => {
    return (
        <DataGrid
            {...props}
            sx={{
                '& .MuiDataGrid-virtualScrollerContent': {
                    borderLeft: '1px solid #0B9150',
                    borderRight: '1px solid #0B9150',
                    borderBottom: '1px solid #0B9150',
                },

                // Header
                '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#0B9150',
                    color: 'white',
                },
                '--DataGrid-containerBackground': '#0B9150',

                // Cell & Row
                '& .MuiDataGrid-cell': {
                    color: '#333',
                },

                // Checkbox
                '& .MuiCheckbox-root svg path': {
                    stroke: '#333',
                    fill: 'transparent',
                },
                '& .MuiCheckbox-root.Mui-checked svg': {
                    color: '#225087',
                    fill: '#225087',
                },
                '& .MuiCheckbox-root:hover': {
                    backgroundColor: 'rgba(12, 146, 81, 0.04)',
                },

                // Pagination
                '& .MuiTablePagination-root': {
                    color: '#0B9150',
                },
                '& .MuiTablePagination-selectLabel, & .MuiSelect-select': {
                    color: '#0B9150',
                },
                '& .MuiTablePagination-actions button': {
                    color: '#0B9150',
                },
                '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid #0B9150',
                },

                // Overlay
                '& .MuiDataGrid-overlay': {
                    backgroundColor: 'transparent',
                },
            }}
        />
    );
};

export default CustomDataGrid;
