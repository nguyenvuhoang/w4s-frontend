"use client";

import PaginationPage from "@/@core/components/jTable/pagination";
import { Locale } from "@/configs/i18n";
import { useCoreOutboundHandler } from "@/services/useCoreOutBoundHandler";
import { CoreOutboundMessageType } from "@/types/bankType";
import { PageData } from "@/types/systemTypes";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import { getLocalizedUrl } from "@/utils/i18n";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";
import { Session } from "next-auth";
import { useState } from "react";

const CoreInboundContent = ({
  session,
  dictionary,
  transactiondata,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactiondata: PageData<CoreOutboundMessageType>;
  locale: Locale;
}) => {
  const {
    contracts,
    page,
    jumpPage,
    rowsPerPage,
    totalCount,
    loading,
    setLoading,
    handleSearch,
    handleJumpPage,
    handlePageChange,
    handlePageSizeChange,
  } = useCoreOutboundHandler(transactiondata, session, locale);
  const [searchText, setSearchText] = useState<string>("");
  const handleRowDoubleClick = (tx: CoreOutboundMessageType) => {
    const id = tx.id;
    if (!id) return;

    const path = getLocalizedUrl("/core-outbound/view/" + id, locale as Locale);

    window.open(path, "_blank", "noopener,noreferrer");
  };

  const statusMap: Record<
    string,
    {
      label: string;
      icon?: React.ReactElement;
      color: "primary" | "error" | "warning" | "default";
    }
  > = {
    SUCCESS: { label: "Success", icon: <CheckIcon />, color: "primary" },
    FAILED: { label: "Failed", icon: <CloseIcon />, color: "error" },
    SENDING: {
      label: "Sending",
      icon: <CircularProgress size={14} />,
      color: "warning",
    },
    QUEUED: { label: "Queued", icon: <ScheduleIcon />, color: "default" },
    DEAD: { label: "Dead", icon: <CloseIcon />, color: "error" },
  };

  return (
    <Box className="mt-5 space-y-5 w-full">
      {/* Filters */}
      <Box className="flex gap-4 items-center">
        <TextField
          size="small"
          placeholder="Search by Execution ID"
          variant="outlined"
          sx={{ width: 250 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value.toLowerCase())}
          slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#225087" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="button"
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            disabled={loading}
            onClick={() => {
              handleSearch({ searchtext: searchText });
            }}
          >
            {dictionary["common"].search}
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "#225087" /* xanh EMI */,
                  "& th": { color: "white", fontWeight: "bold" },
                }}
              >
                <TableCell>{dictionary["coreoutbound"].executionid}</TableCell>
                <TableCell>{dictionary["coreoutbound"].createdonutc}</TableCell>
                <TableCell>{dictionary["coreoutbound"].reference}</TableCell>
                <TableCell>{dictionary["coreoutbound"].messagetype}</TableCell>
                <TableCell>
                  {dictionary["coreoutbound"].targetendpoint}
                </TableCell>
                <TableCell>{dictionary["coreoutbound"].httpmethod}</TableCell>
                <TableCell>{dictionary["coreoutbound"].status}</TableCell>
                {/* <TableCell>{dictionary["coreoutbound"].attemptcount}</TableCell>
                <TableCell>{dictionary["coreoutbound"].maxattempt}</TableCell> */}
                <TableCell>{dictionary["coreoutbound"].lasterror}</TableCell>
                {/* <TableCell>
                  {dictionary["coreoutbound"].nextattemptonutc}
                </TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : contracts?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    {dictionary["coreoutbound"].notransactionfound}
                  </TableCell>
                </TableRow>
              ) : (
                contracts?.items.map((tx) => (
                  <TableRow
                    key={tx.execution_id}
                    onDoubleClick={() => handleRowDoubleClick(tx)}
                    sx={{ cursor: "pointer" }}
                    hover
                  >
                    <TableCell>{tx.execution_id}</TableCell>
                    <TableCell>
                      {formatDateTime(tx.created_on_utc.toString())}
                    </TableCell>
                    <TableCell>{tx.reference}</TableCell>
                    <TableCell>{tx.message_type}</TableCell>
                    <TableCell>{tx.target_endpoint}</TableCell>
                    <TableCell>{tx.http_method}</TableCell>
                    <TableCell>
                      <Chip
                        icon={statusMap[tx.status]?.icon}
                        label={statusMap[tx.status]?.label ?? tx.status}
                        color={statusMap[tx.status]?.color ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    {/* <TableCell>{tx.attempt_count}</TableCell>
                    <TableCell>{tx.max_attempt}</TableCell> */}
                    <TableCell
                      sx={{
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {tx.last_error}
                    </TableCell>

                    {/* <TableCell>
                      {formatDateTime(tx.next_attempt_on_utc.toString())}
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {totalCount > 0 && (
          <Box mt={5} sx={{ '& .MuiPaginationItem-root.Mui-selected': { backgroundColor: '#225087 !important' } }}>
            <PaginationPage
              page={page}
              pageSize={rowsPerPage}
              totalResults={totalCount}
              jumpPage={jumpPage}
              handlePageChange={handlePageChange}
              handlePageSizeChange={handlePageSizeChange}
              handleJumpPage={handleJumpPage}
              dictionary={dictionary}
            />
          </Box>
        )}
      </Box>
  );
};

export default CoreInboundContent;
