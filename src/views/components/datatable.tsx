import { TableData } from '@shared/types/systemTypes';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import React, { useState } from 'react';

interface DataTableProps {
    tabledata: TableData;
}

const DataTable: React.FC<DataTableProps> = ({ tabledata }) => {
    const { headers, data } = tabledata;
    const headerKeys = Object.keys(headers);

    // State for storing search values and visibility of each column's search input
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>(
        headerKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {})
    );
    const [isSearchVisible, setIsSearchVisible] = useState<Record<string, boolean>>(
        headerKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );

    // Handler for updating search terms
    const handleSearchChange = (key: string, value: string) => {
        setSearchTerms((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Handler for toggling search input visibility
    const toggleSearchVisibility = (key: string) => {
        setIsSearchVisible((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
        if (isSearchVisible[key]) {
            // Clear search term if closing the search
            setSearchTerms((prev) => ({
                ...prev,
                [key]: '',
            }));
        }
    };

    // Filtered data based on search terms
    const filteredData = data.filter((row) =>
        headerKeys.every((key) =>
            row[key].toString().toLowerCase().includes(searchTerms[key].toLowerCase())
        )
    );

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {headerKeys.map((headerKey, index) => (
                            <TableCell
                                key={index}
                                sx={{
                                    border: '1px solid #ddd', // Border for each cell
                                    backgroundColor: '#f5f5f5', // Light gray background for header
                                }}
                            >
                                {/* Header label */}
                                {headers[headerKey]}
                                {/* Search icon for each column, conditionally styled */}
                                <IconButton
                                    onClick={() => toggleSearchVisibility(headerKey)}
                                    size="small"
                                    sx={{
                                        color: isSearchVisible[headerKey] ? 'red' : 'inherit',
                                        marginLeft: 1,
                                    }}
                                >
                                    {isSearchVisible[headerKey] ? (
                                        <CloseIcon fontSize="small" />
                                    ) : (
                                        <SearchIcon fontSize="small" />
                                    )}
                                </IconButton>
                                {/* Search input, shown only if toggled */}
                                {isSearchVisible[headerKey] && (
                                    <TextField
                                        variant="outlined"
                                        size="small"
                                        placeholder={`Search ${headers[headerKey]}`}
                                        value={searchTerms[headerKey]}
                                        onChange={(e) => handleSearchChange(headerKey, e.target.value)}
                                        sx={{ marginTop: 1 }}
                                        fullWidth
                                    />
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredData.map((row, rowIndex) => (
                        <TableRow
                            key={rowIndex}
                            sx={{
                                backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9', // Alternating row colors
                            }}
                        >
                            {headerKeys.map((headerKey, cellIndex) => (
                                <TableCell
                                    key={cellIndex}
                                    sx={{
                                        border: '1px solid #ddd', // Border for each cell
                                    }}
                                >
                                    {row[headerKey]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DataTable;

