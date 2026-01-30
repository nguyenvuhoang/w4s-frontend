"use client";

import { handleSearchAPI } from "@/@core/components/cButton/handleSearchAPI";
import PaginationPage from "@/@core/components/jTable/pagination";
import {
  StyledHeaderCell,
  StyledTableRow,
} from "@/@core/components/jTable/style";
import PreviewContent from "@components/forms/previewcontent";
import LoadingSubmit from "@components/LoadingSubmit";
import { FormInput } from "@shared/types/systemTypes";
import { generateCellTable } from "@utils/generateCellTable";
import { getDictionary } from "@utils/getDictionary";
import { getNestedValue } from "@utils/getNestedValue";
import {
  Box,
  Grid,
  Modal,
  Paper,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";

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
  isFetching: boolean;
  ismodify: boolean;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  renderviewdata?: any;
};

const RenderTableDefault = ({
  input,
  gridProps,
  onRowDoubleClick,
  isFetching,
  ismodify,
  dictionary,
  renderviewdata,
}: Props) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]); // Dá»¯ liá»‡u sau khi lá»c
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [page, setPage] = useState(1);
  const [searchVisible, setSearchVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [totalResults, setTotalResults] = useState(0); // Tá»•ng sá»‘ báº£n ghi
  const [pageSize, setPageSize] = useState(
    parseInt(input.config.paging_record || "50", 10)
  ); // Sá»‘ báº£n ghi má»—i trang (máº·c Ä‘á»‹nh lÃ  5)
  const [jumpPage, setJumpPage] = useState(1); // Sá»‘ trang muá»‘n nháº£y Ä‘áº¿n
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  // Hooks
  const { data: session } = useSession();
  const columns = JSON.parse(input.config.columns || "[]"); // Parse cá»™t tá»« config

  const memoizedColumns = useMemo(() => JSON.parse(input.config.columns || "[]"), [input.config.columns]);
  const memoizedRenderViewData = useMemo(() => renderviewdata, [renderviewdata]);


  const mapData = (data: any[], columns: { code: string }[]) => {
    return data.map((item: any) => {
      const filteredData: { [key: string]: any } = {};
      columns.forEach((column: { code: string }) => {
        const columnKey = column.code.split(".").pop();
        filteredData[column.code] =
          columnKey && item[columnKey] !== undefined ? item[columnKey] : "N/A";
      });
      filteredData.id = item.id || null;
      return filteredData;
    });
  };


  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (memoizedRenderViewData) {
          const dataTableDefault = memoizedRenderViewData?.[input.default?.code] || [];
          const mappedData = mapData(dataTableDefault, memoizedColumns);

          if (isMounted && JSON.stringify(data) !== JSON.stringify(mappedData)) {
            setData(mappedData);
            setFilteredData(mappedData);
          }
        } else {
          const txfoSearch = JSON.parse(input.config.txFo);
          const searchAPI = await handleSearchAPI(session, txfoSearch, page, pageSize);

          const dataItem = searchAPI?.items || [];
          const total_count = searchAPI?.total_count || 0;
          const mappedData = mapData(dataItem, memoizedColumns);

          if (isMounted && JSON.stringify(data) !== JSON.stringify(mappedData)) {
            setData(mappedData);
            setFilteredData(mappedData);
            setTotalResults(total_count);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setData([]);
          setFilteredData([]);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [memoizedRenderViewData, input, session, pageSize, page, memoizedColumns, data]);


  useEffect(() => {
    const filtered = data.filter((row) =>
      memoizedColumns.every((column: { code: string }) => {
        const searchTerm = searchTerms[column.code];
        if (!searchTerm) return true;
        const cellValue = getNestedValue(row, column.code).toString().toLowerCase();
        return cellValue.includes(searchTerm.toLowerCase());
      })
    );
    setFilteredData(filtered);
  }, [searchTerms, data, memoizedColumns]);


  const handleSearchChange = (columnCode: string, value: string) => {
    setSearchTerms((prev) => ({ ...prev, [columnCode]: value }));
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOptionClick = (action: string) => {
    if (action === "modify") {
      onRowDoubleClick(selectedRow, input);
    }
    handleClose();
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
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
    ismodify?: boolean
  ) => {
    if (ismodify) {
      setSelectedRow(rowdata);
      setAnchorEl(e.currentTarget as HTMLElement);
    } else {
      onRowDoubleClick(rowdata, input);
    }
  };

  const handlePreviewModal = (data: any, previewtype: string) => {
    const preview = {
      previewtype: previewtype,
      previewdata: JSON.parse(data),
    };
    console.log(preview);
    setModalContent(preview);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <Grid size={gridProps} sx={{ marginBottom: "16px", position: "relative" }}>
      {/* LoadingSubmit náº±m giá»¯a ná»™i dung báº£ng */}
      {isFetching && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "8px",
            padding: "50px", // TÃ¹y chá»n thÃªm khoáº£ng cÃ¡ch
          }}
        >
          <LoadingSubmit loadingtext={dictionary['common'].loading} />
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column: Column, index: number) => (
                <StyledHeaderCell key={index}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {column.title}
                  </div>
                </StyledHeaderCell>
              ))}
            </TableRow>

            {Object.values(searchVisible).some((visible) => visible) && (
              <TableRow>
                {columns.map((column: Column, index: number) => (
                  <StyledHeaderCell key={index}>
                    {searchVisible[column.code] && (
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder={`Search ${column.title}`}
                        value={searchTerms[column.code] || ""}
                        onChange={(e) =>
                          handleSearchChange(column.code, e.target.value)
                        }
                        sx={{
                          width: "100%",
                          borderRadius: "4px",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: "#cccccc",
                              color: "#ffffff !important",
                            },
                            "&:hover fieldset": {
                              borderColor: "#ffffff",
                              color: "#ffffff !important",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#ffffff",
                              color: "#ffffff !important",
                            },
                          },
                          "& .MuiOutlinedInput-input": {
                            color: "white !important",
                            "& fieldset": {
                              borderColor: "#cccccc",
                              color: "#ffffff !important",
                            },
                            "&:hover fieldset": {
                              borderColor: "#ffffff",
                              color: "#ffffff !important",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#ffffff",
                              color: "#ffffff !important",
                            },
                          },
                          color: "white !important",
                        }}
                      />
                    )}
                  </StyledHeaderCell>
                ))}
              </TableRow>
            )}
          </TableHead>

          <TableBody>
            {!isFetching && filteredData.length > 0
              ? filteredData.map((row, rowIndex) => (
                <StyledTableRow
                  key={rowIndex}
                  onDoubleClick={() => onRowDoubleClick(row, input)}
                >
                  {columns.map(
                    (
                      column: {
                        code: string;
                        inputtype: string;
                        onClick: void;
                        config: any;
                      },
                      colIndex: React.Key | null | undefined
                    ) => {
                      const value = getNestedValue(row, column.code);
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
                            column.inputtype === "cButtonOnTable"
                              ? (event, row, input, ismodify) =>
                                handleAction(event, row, input, ismodify)
                              : undefined,
                            handlePreviewModal
                          )}
                        </TableCell>
                      );
                    }
                  )}
                </StyledTableRow>
              ))
              : !isFetching && (
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
      {!isFetching && totalResults > 0 && (
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
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
            }}
          >
            <PreviewContent
              content={modalContent}
              onClose={handleCloseModal}
              dictionary={dictionary}
            />
          </div>
        </Modal>
      )}
    </Grid>
  );
};

export default RenderTableDefault;

