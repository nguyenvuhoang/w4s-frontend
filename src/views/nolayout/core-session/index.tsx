"use client";

import PaginationPage from "@/@core/components/jTable/pagination";
import EmptyListNotice from "@/components/layout/shared/EmptyListNotice";
import { Locale } from "@/configs/i18n";
import { useCoreSessionHandler } from "@/services/useCoreSessionHandler";
import { CoreSessionType } from "@/types/bankType";
import { PageData } from "@/types/systemTypes";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import { getLocalizedUrl } from "@/utils/i18n";
import SearchIcon from "@mui/icons-material/Search";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Session } from "next-auth";
import { useState } from "react";

const CoreSessionContent = ({
  session,
  dictionary,
  transactiondata,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactiondata: PageData<CoreSessionType>;
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
  } = useCoreSessionHandler(transactiondata, session, locale);

  const [searchText, setSearchText] = useState<string>("");
  const handleRowDoubleClick = (tx: CoreSessionType) => {
    const id = tx.id;
    if (!id) return;

    const path = getLocalizedUrl("/core-session/view/" + id, locale as Locale);

    window.open(path, "_blank", "noopener,noreferrer");
  };
  const BranchCodes: Record<string, string> = {
    "0000": "EMI Headquarter",
    "0001": "HQ Service Unit",
    "0002": "Sikhote Service Unit",
    "0003": "Saysetha Service Unit",
    "0004": "Sisathanak Service Unit",
    "0005": "Saythany Service Unit",
    "0006": "Phonehong Service Unit",
    "0007": "Thoulakhom Service Unit",
    "0008": "Naxaythong Service Unit",
    "0009": "Savannakhet Service Unit",
    "0010": "Luangprabang Service Unit",
    "0011": "Paklai Service Unit",
    "0012": "Vangvieng Service Unit",
    "0013": "Phieng Service Unit",
    "0014": "Xayabouly Province Service Unit",
    "0015": "Borlikhamxay Service Unit",
  };
  
  const getBranchName = (code: string): string =>
    BranchCodes[code] ?? "Unknown Branch";

  return (
    <Box className="mt-5 space-y-5 w-full">
      <Box className="flex gap-4 items-center">
        <TextField
          size="small"
          placeholder="Search by Login name"
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
                <TableCell>{dictionary["coresession"].token}</TableCell>
                <TableCell>{dictionary["coresession"].userid}</TableCell>
                <TableCell>{dictionary["coresession"].loginname}</TableCell>
                <TableCell>{dictionary["coresession"].workingdate}</TableCell>
                <TableCell>{dictionary["coresession"].expiresat}</TableCell>
                <TableCell>{dictionary["coresession"].isrevoked}</TableCell>
                <TableCell>{dictionary["coresession"].channel}</TableCell>
                <TableCell>{dictionary["coresession"].createdonutc}</TableCell>
                <TableCell>{dictionary["coresession"].branch}</TableCell>
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
                  <TableCell colSpan={10}>
                    <EmptyListNotice message={dictionary.account.nodatatransactionhistory} />
                  </TableCell>
                </TableRow>
              ) : (
                contracts?.items.map((tx) => (
                  <TableRow
                    key={tx.id}
                    onDoubleClick={() => handleRowDoubleClick(tx)}
                    sx={{ cursor: "pointer" }}
                    hover
                  >
                    <TableCell>{tx.token}</TableCell>
                    <TableCell>{tx.user_id}</TableCell>
                    <TableCell>{tx.login_name}</TableCell>
                    <TableCell>{formatDateTime(tx.workingdate?.toString?.() ?? "")}</TableCell>
                    <TableCell>{formatDateTime(tx.expires_at?.toString?.() ?? "")}</TableCell>
                    <TableCell>
                      {tx.is_revoked ? (
                        <FiberManualRecordIcon sx={{ fontSize: 14, color: "red" }} />
                      ) : (
                        <FiberManualRecordIcon sx={{ fontSize: 14, color: "green" }} />
                      )}
                    </TableCell>
                    <TableCell>{tx.channel_id}</TableCell>
                    <TableCell>{formatDateTime(tx.created_on_utc?.toString?.() ?? "")}</TableCell>
                    <TableCell>{getBranchName(tx.branch_code)}</TableCell>
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

export default CoreSessionContent;
