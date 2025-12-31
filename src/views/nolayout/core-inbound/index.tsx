"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Button,
  LinearProgress,
  TextField,
  InputAdornment,
  TableContainer,
  Chip,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { Session } from "next-auth";
import { getDictionary } from "@/utils/getDictionary";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CoreInboundMessageType } from "@/types/bankType";
import { PageData } from "@/types/systemTypes";
import { systemServiceApi } from "@/servers/system-service";
import { formatDateTime } from "@/utils/formatDateTime";
import { formatCurrency } from "@/utils/formatCurrency";
import { useRouter } from "next/navigation";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Locale } from "@/configs/i18n";
import { useCoreInboundHandler } from "@/services/useCoreInBoundHandler";
import { getLocalizedUrl } from "@/utils/i18n";
import PaginationPage from "@/@core/components/jTable/pagination";

const CoreInboundContent = ({
  session,
  dictionary,
  transactiondata,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactiondata: PageData<CoreInboundMessageType>;
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
  } = useCoreInboundHandler(transactiondata, session, locale);

  const [searchText, setSearchText] = useState<string>("");
  // const filtered = pagedData.items.filter(
  //   (tx) =>
  //     // (channelFilter === "ALL" || tx.channel_id === channelFilter) &&
  //     (searchText === "" || tx.execution_id.includes(searchText))
  // );

  // const successCount = filtered.filter(
  //   (tx) => tx.status === "COMPLETED"
  // ).length;
  // const failCount = filtered.filter((tx) => tx.status !== "COMPLETED").length;
  // const total = filtered.length;
  // const successRate = total > 0 ? (successCount / total) * 100 : 0;

  const handleRowDoubleClick = (tx: CoreInboundMessageType) => {
    const id = tx.id;
    if (!id) return;

    const path = getLocalizedUrl("/core-inbound/view/" + id, locale as Locale);

    window.open(path, "_blank", "noopener,noreferrer");
  };

  const statusMap: Record<
    string,
    {
      label: string;
      icon?: React.ReactElement;
      color: "primary" | "error" | "warning" | "default" | "success";
    }
  > = {
    RECEIVED: {
      label: "Received",
      icon: <AccessTimeIcon />,
      color: "default",
    },
    VERIFIED: {
      label: "Verified",
      icon: <CheckCircleOutlineIcon />,
      color: "success",
    },
    FAILED: { label: "Failed", icon: <CancelIcon />, color: "error" },
    COMPLETED: { label: "Completed", icon: <DoneAllIcon />, color: "primary" },
  };
  return (
    <Box className="mt-5 space-y-5 w-full">
      {/* Status Bar */}
      {/* <Box>
        <Typography variant="h6" className="mb-1">
          {dictionary["coreinbound"].transactionsuccessrate}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={successRate}
          sx={{ height: 10, borderRadius: 5 }}
          color={successRate >= 80 ? "primary" : "error"}
        />
        <Typography className="mt-2 text-sm text-gray-600">
          {successCount} {dictionary["coreinbound"].transactionresultsuccess}{" "}
          / {failCount} {dictionary["coreinbound"].transactionresultfailed}
        </Typography>
      </Box> */}

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
                <TableCell>{dictionary["coreinbound"].executionid}</TableCell>
                <TableCell>{dictionary["coreinbound"].createdonutc}</TableCell>
                <TableCell>
                  {dictionary["coreinbound"].transactioncode}
                </TableCell>
                <TableCell>{dictionary["coreinbound"].endtoend}</TableCell>
                <TableCell>{dictionary["coreinbound"].channel}</TableCell>
                <TableCell>{dictionary["coreinbound"].service}</TableCell>
                <TableCell>{dictionary["coreinbound"].status}</TableCell>
                <TableCell>
                  {dictionary["coreinbound"].signatureverified}
                </TableCell>
                <TableCell>
                  {dictionary["coreinbound"].errordescription}
                </TableCell>
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
                    {dictionary["coreinbound"].notransactionfound}
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
                    <TableCell>{tx.transaction_code}</TableCell>
                    <TableCell>{tx.end_to_end}</TableCell>
                    <TableCell>{tx.channel_id}</TableCell>
                    <TableCell>{tx.service_id}</TableCell>
                    <TableCell>
                      <Chip
                        icon={statusMap[tx.status]?.icon}
                        label={statusMap[tx.status]?.label ?? tx.status}
                        color={statusMap[tx.status]?.color ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {tx.signature_verified ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </TableCell>
                    <TableCell>{tx.error_description}</TableCell>
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
