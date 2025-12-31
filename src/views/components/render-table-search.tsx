/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import PaginationPage from '@/@core/components/jTable/pagination';
import { StyledHeaderCell, StyledTableRow } from '@/@core/components/jTable/style';
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon';
import Application from '@/@core/lib/libSupport';
import { useUserStore } from '@/@core/stores/useUserStore';
import PreviewContent from '@/components/forms/previewcontent';
import { Locale } from '@/configs/i18n';
import { useRowSelection } from '@/contexts/RowSelectionContext';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { generateCellTable } from '@/utils/generateCellTable';
import { getDictionary } from '@/utils/getDictionary';
import { getNestedValue } from '@/utils/getNestedValue';
import SwalAlert from '@/utils/SwalAlert';
import { Box, Checkbox, Grid, Modal, Paper, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Session } from 'next-auth';
import React, { Dispatch, useEffect, useState } from 'react';
type Column = {
    code: string;
    title: string;
    inputtype: string;
    config: object;
};

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    rules: RuleStrong[];
    session: Session | null;
    onRowDoubleClick: (rowData: any, input: FormInput) => void;
    datasearch: PageData<any> | undefined;
    txfoSearch: any;
    setDatasearch: Dispatch<React.SetStateAction<PageData<any> | undefined>>;
    setLoading: (loading: boolean) => void;
    datasearchlookup: PageData<any> | undefined;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    searchtext?: string;
    roleTask?: any;
    language: Locale;
};

const RenderTableSearchAdvance = ({
    input,
    gridProps,
    rules,
    session,
    onRowDoubleClick,
    txfoSearch,
    datasearch,
    setDatasearch,
    setLoading,
    dictionary,
    datasearchlookup,
    roleTask,
    language
}: Props) => {
    const [filteredData, setFilteredData] = useState<any>([]);
    const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalResults, setTotalResults] = useState(0);
    const [jumpPage, setJumpPage] = useState(1);
    const [triggerSearch, setTriggerSearch] = useState(false);
    const [modalContent, setModalContent] = useState<any>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const columns = JSON.parse(input.config.columns || '[]');

    const { addRow, removeRow, isRowSelected } = useRowSelection();

    useEffect(() => {
        if (!datasearch) return;

        const filtered = datasearch?.items?.filter(
            (row) =>
                Object.keys(row).length > 0 && // Loại bỏ các đối tượng trống
                columns.every((column: { code: string }) => {
                    const searchTerm = searchTerms[column.code];
                    if (!searchTerm) return true;
                    const cellValue = getNestedValue(row, column.code)?.toString().toLowerCase() || '';
                    return cellValue.includes(searchTerm.toLowerCase());
                })
        );

        setFilteredData(filtered);
        setTotalResults(datasearch?.total_count || 0);
        setPage(datasearch?.pageindex || 1);
        setPageSize(datasearch?.pagesize || 10);
    }, [datasearch]);

    useEffect(() => {
        if (!datasearchlookup) return;

        const filtered = datasearch?.items.filter(
            (row) =>
                Object.keys(row).length > 0 &&
                columns.every((column: { code: string }) => {
                    const searchTerm = searchTerms[column.code];
                    if (!searchTerm) return true;
                    const cellValue = getNestedValue(row, column.code)?.toString().toLowerCase() || '';
                    return cellValue.includes(searchTerm.toLowerCase());
                })
        );

        setFilteredData(filtered);
        setTotalResults(datasearch?.total_count || 0);
        setPage(datasearch?.pageindex || 1);
        setPageSize(datasearch?.pagesize || 10);
    }, [datasearchlookup]);

    const executeSearchAPI = async (pageindex: number, pagesize: number) => {
        setLoading(true);
        try {
            if (txfoSearch !== undefined) {
                const response = await handleSearchAPI(session, txfoSearch, pageindex, pagesize);

                const updatedResponse: PageData<any> = {
                    total_count: response?.total_count ?? 0,
                    total_pages: response?.total_pages ?? 0,
                    has_previous_page: response?.has_previous_page ?? false,
                    has_next_page: response?.has_next_page ?? false,
                    items: response?.items ?? [],
                    pageindex,
                    pagesize,
                };

                setDatasearch(updatedResponse);
            } else {
                Application.AppException('#CBUTTON.onClick', 'Error Json is undefined', 'Error');
            }
        } catch (error) {
            Application.AppException('#CBUTTON.onClick', String(error), 'Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (triggerSearch) {
            executeSearchAPI(page, pageSize).then(() => setTriggerSearch(false));
        }
    }, [triggerSearch]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        if (value !== page) {
            setPage(value);
            setTriggerSearch(true);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value);
        if (newSize !== pageSize) {
            setPageSize(newSize);
            setTriggerSearch(true);
        }
    };

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= Math.ceil(totalResults / pageSize)) {
            setJumpPage(value);
            setPage(value);
        }
    };

    const handlePreviewModal = (data: any, previewtype: string, datatype?: string, app?: string) => {
        try {
            if (data === undefined || data === null) {
                console.warn('Data is undefined or null');
                return;
            }

            const preview = {
                previewtype: previewtype,
                previewdata: datatype === 'JSON'
                    ? JSON.parse(data)
                    : datatype === 'XML'
                        ? new DOMParser().parseFromString(data, 'text/xml')
                        : data,
                datatype: datatype,
            };

            setModalContent(preview);
            setModalOpen(true);
        } catch (error) {
            console.error('Failed to parse data:', error);
        }
    };

    const handleCheckboxChange = (row: any) => {
        if (isRowSelected(row)) {
            removeRow(row);
        } else {
            addRow(row);
        }
    };


    const disableontableaction = rules.some((rule) => rule.code === 'managerComponent' && rule.config.disableontableaction === 'true');
    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {disableontableaction ? null : (
                                <StyledHeaderCell>

                                </StyledHeaderCell>
                            )}
                            {columns.map((column: Column, index: number) => (
                                <StyledHeaderCell key={index}>
                                    <Box style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                    >
                                        {column.title}
                                    </Box>
                                </StyledHeaderCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData?.length > 0 ? (
                            filteredData.map((row: any, rowIndex: React.Key | null | undefined) => {
                                const isCheck = isRowSelected(row);
                                return (
                                    <StyledTableRow
                                        key={rowIndex}
                                        onDoubleClick={() => {
                                            const action = input?.config?.actionFo_RowSelect?.useAction;

                                            if (action === 'viewdetail') {
                                                const codeHidden = input?.default?.codeHidden
                                                const { role } = useUserStore.getState()

                                                const isNotAllowed = role.some(r => {
                                                    const roleId = r.role_id?.toString()
                                                    return roleTask?.[roleId]?.[codeHidden]?.component?.install === false
                                                })

                                                if (isNotAllowed) {
                                                    SwalAlert("warning", `${dictionary['common'].nopermissionview}`, "center")
                                                    return
                                                }
                                            }
                                            onRowDoubleClick(row, input);
                                        }}
                                    >
                                        {disableontableaction ? null : (
                                            <TableCell>
                                                <Checkbox
                                                    icon={<CustomCheckboxIcon checked={false} />}
                                                    checkedIcon={<CustomCheckboxIcon checked={true} />}
                                                    checked={isCheck}
                                                    onChange={() => handleCheckboxChange(row)}
                                                    sx={{ padding: 0 }}
                                                />
                                            </TableCell>
                                        )}

                                        {columns.map((
                                            column: { code: string; inputtype: string; onClick: void; config: any },
                                            colIndex: React.Key | null | undefined
                                        ) => {
                                            const value = getNestedValue(row, column.code);
                                            return (
                                                <TableCell
                                                    id='table-search-advance'
                                                    key={colIndex}
                                                    sx={{
                                                        fontSize: '0.875rem',
                                                        fontFamily: 'Quicksand, sans-serif'
                                                    }}
                                                >

                                                    {generateCellTable(
                                                        column,
                                                        value,
                                                        row,
                                                        input,
                                                        undefined,
                                                        undefined,
                                                        undefined,
                                                        undefined,
                                                        undefined,
                                                        handlePreviewModal,
                                                        language
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </StyledTableRow>
                                );
                            })
                        ) : (
                            <StyledTableRow>
                                <TableCell colSpan={columns.length + 1} align="center">
                                    {dictionary['common'].nodata}
                                </TableCell>
                            </StyledTableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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

            {isModalOpen && (
                <Modal open={isModalOpen} onClose={handleCloseModal}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '100vh',
                        }}
                    >
                        <PreviewContent content={modalContent} onClose={handleCloseModal} dictionary={dictionary} />
                    </div>
                </Modal>
            )}
        </Grid>
    );
};

export default RenderTableSearchAdvance;
