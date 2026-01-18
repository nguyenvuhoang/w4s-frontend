'use client';

import { Session } from 'next-auth';
import React, { Dispatch, memo, useCallback } from 'react';

import PaginationPage from '@/@core/components/jTable/pagination';
import { StyledHeaderCell, StyledTableRow } from '@/@core/components/jTable/style';
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon';
import PreviewContent from '@/components/forms/previewcontent';
import { Locale } from '@/configs/i18n';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { generateCellTable } from '@/utils/generateCellTable';
import { getDictionary } from '@/utils/getDictionary';
import { getNestedValue } from '@/utils/getNestedValue';
import {
  Box,
  Checkbox,
  Grid,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { useUserStore } from '@/@core/stores/useUserStore';
import SwalAlert from '@/utils/SwalAlert';
import { Column, useRenderTableSearch } from '@features/dynamicform/hooks/useRenderTableSearch';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Component
// ============================================================================

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
  language,
}: Props) => {
  // Get role at component level for permission checks
  const role = useUserStore((state) => state.role);

  // All logic is encapsulated in the custom hook
  const {
    filteredData,
    page,
    pageSize,
    totalResults,
    jumpPage,
    modalContent,
    isModalOpen,
    columns,
    disableOnTableAction,
    isRowSelected,
    handlePageChange,
    handlePageSizeChange,
    handleJumpPage,
    handleCloseModal,
    handlePreviewModal,
    handleCheckboxChange,
  } = useRenderTableSearch({
    input,
    rules,
    session,
    onRowDoubleClick,
    datasearch,
    txfoSearch,
    setDatasearch,
    setLoading,
    datasearchlookup,
    dictionary,
    roleTask,
  });

  // Memoized handler for row double click with permission check
  const handleRowDoubleClickWithPermission = useCallback((row: any) => {
    const action = input?.config?.actionFo_RowSelect?.useAction;

    if (action === 'viewdetail') {
      const codeHidden = input?.default?.codeHidden;

      const isNotAllowed = role.some(r => {
        const roleId = r.role_id?.toString();
        return roleTask?.[roleId]?.[codeHidden]?.component?.install === false;
      });

      if (isNotAllowed) {
        SwalAlert("warning", `${dictionary['common'].nopermissionview}`, "center");
        return;
      }
    }
    onRowDoubleClick(row, input);
  }, [input, role, roleTask, dictionary, onRowDoubleClick]);

  return (
    <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          {/* Table Header */}
          <TableHead>
            <TableRow>
              {!disableOnTableAction && <StyledHeaderCell />}
              {columns.map((column: Column, index: number) => (
                <StyledHeaderCell key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {column.title}
                  </Box>
                </StyledHeaderCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {filteredData?.length > 0 ? (
              filteredData.map((row: any, rowIndex: number) => {
                const isCheck = isRowSelected(row);
                const rowKey = row.id ?? row._id ?? rowIndex;
                return (
                  <StyledTableRow
                    key={rowKey}
                    onDoubleClick={() => handleRowDoubleClickWithPermission(row)}
                  >
                    {/* Checkbox Column */}
                    {!disableOnTableAction && (
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

                    {/* Data Columns */}
                    {columns.map((column: Column) => {
                      const value = getNestedValue(row, column.code);
                      return (
                        <TableCell
                          id="table-search-advance"
                          key={column.code}
                          sx={{
                            fontSize: '0.875rem',
                            fontFamily: 'Quicksand, sans-serif',
                          }}
                        >
                          {generateCellTable(
                            column as { code: string; inputtype: string; onClick: any; config: any },
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

      {/* Pagination */}
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

      {/* Preview Modal */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleCloseModal}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
            }}
          >
            <PreviewContent
              content={modalContent}
              onClose={handleCloseModal}
              dictionary={dictionary}
            />
          </Box>
        </Modal>
      )}
    </Grid>
  );
};

export default memo(RenderTableSearchAdvance);
