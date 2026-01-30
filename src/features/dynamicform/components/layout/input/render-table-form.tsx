/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import PaginationPage from '@/@core/components/jTable/pagination';
import { StyledHeaderCell, StyledTableRow } from '@/@core/components/jTable/style';
import { FormInput, PageData } from '@shared/types/systemTypes';
import { generateCellTable } from '@utils/generateCellTable';
import { getNestedValue } from '@utils/getNestedValue';
import { Grid, Paper, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

type Column = {
    code: string;
    title: string;
    inputtype: string;
    config: object;
};

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    onRowDoubleClick: (rowData: any, input: FormInput) => void;
    renderviewdata?: any;
    ismodify?: boolean;
    datasearchdefault: PageData<any> | undefined;
};


const RenderTableForm = ({ input, gridProps, onRowDoubleClick, renderviewdata, ismodify }: Props) => {

    //State
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>(data);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0); // Tá»•ng sá»‘ báº£n ghi
    const [pageSize, setPageSize] = useState(parseInt(input.config.paging_record || '50', 10)); // Sá»‘ báº£n ghi má»—i trang (máº·c Ä‘á»‹nh lÃ  5)
    const [jumpPage, setJumpPage] = useState(1); // Sá»‘ trang muá»‘n nháº£y Ä‘áº¿n

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Láº¥y cá»™t tá»« config
    const columns = JSON.parse(input.config.columns || '[]');

    const hasSystemColumnCheck = input.config.hasSystemColumnCheck === 'true';

    // Láº¥y dá»¯ liá»‡u tá»« renderviewdata
    const keygetdata = input.config.onKeyTable || '';

    const rendertabledata = renderviewdata[keygetdata] || [];

    //Hooks
    const parsedColumns = useMemo(() => JSON.parse(input.config.columns || '[]'), [input.config.columns]);

    useEffect(() => {

        if (rendertabledata && Array.isArray(rendertabledata)) {

            const mappedData = rendertabledata.map((item: any) => {
                const filteredData: { [key: string]: any } = {};
                parsedColumns.forEach((column: { code: string }) => {
                    const columnKey = column.code.split('.').pop();
                    filteredData[column.code] = columnKey && item[columnKey] !== undefined ? item[columnKey] : 'N/A';
                });
                filteredData.id = item.id || null;
                return filteredData;
            });

            setData(mappedData);
            setFilteredData(mappedData);
            setTotalResults(mappedData.length);
        }
    }, [rendertabledata, parsedColumns, input.inputtype]);



    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        setPageSize(Number(event.target.value));
        setPage(1); // Reset vá» trang 1 khi Ä‘á»•i sá»‘ báº£n ghi
    };


    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= Math.ceil(totalResults / pageSize)) {
            setJumpPage(value);
            setPage(value);
        }
    };

    const handleAction = (
        e: React.MouseEvent<SVGSVGElement | HTMLElement>,
        rowdata: any,
        input: FormInput,
        ismodify?: boolean) => {
        if (ismodify) {
            setSelectedRow(rowdata);
            setAnchorEl(e.currentTarget as HTMLElement);
        } else {
            onRowDoubleClick(rowdata, input)
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOptionClick = (action: string) => {
        console.log(`Selected action: ${action}`, selectedRow);
        if (action === 'modify') {
            onRowDoubleClick(selectedRow, input)
        }
        handleClose();

    };


    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {/* Render cÃ¡c cá»™t khÃ¡c */}
                            {columns.map((column: Column, index: number) => (
                                <StyledHeaderCell key={index}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        {column.title}
                                    </div>
                                </StyledHeaderCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row, rowIndex) => (
                                <StyledTableRow
                                    key={rowIndex}
                                    {...(!hasSystemColumnCheck && { onDoubleClick: () => onRowDoubleClick(row, input) })}
                                >
                                    {columns.map((column: { code: string, inputtype: string, onClick: void, config: any }, colIndex: React.Key | null | undefined) => {
                                        const value = getNestedValue(row, column.code);
                                        const inputtype = column.inputtype;
                                        return (
                                            <TableCell key={colIndex}>
                                                {generateCellTable(
                                                    column,
                                                    value,
                                                    row,
                                                    input,
                                                    handleOptionClick,
                                                    ismodify,
                                                    anchorEl,
                                                    handleClose,
                                                    inputtype === 'cButtonOnTable' ? (event, row, input, ismodify) => handleAction(event, row, input, ismodify) : undefined
                                                )}
                                            </TableCell>
                                        )
                                    })}
                                </StyledTableRow>
                            ))
                        ) : (
                            <StyledTableRow>
                                <TableCell colSpan={columns.length} align="center">
                                    No data available
                                </TableCell>
                            </StyledTableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* PhÃ¢n trang */}
            {totalResults > 0 && (
                <PaginationPage
                    page={page}
                    pageSize={pageSize}
                    totalResults={totalResults}
                    jumpPage={jumpPage}
                    handlePageSizeChange={handlePageSizeChange}
                    handlePageChange={handlePageChange}
                    handleJumpPage={handleJumpPage}
                />
            )}

        </Grid>
    );
};

export default RenderTableForm;

