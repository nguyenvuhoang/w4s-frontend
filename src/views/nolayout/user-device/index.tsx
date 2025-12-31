"use client";

import PaginationPage from "@/@core/components/jTable/pagination";
import EmptyListNotice from "@/components/layout/shared/EmptyListNotice";
import { Locale } from "@/configs/i18n";
import { useUserDeviceHandler } from "@/services/useUserDeviceHandler";
import { UserDeviceType } from "@/types/bankType";
import { PageData } from "@/types/systemTypes";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import { getLocalizedUrl } from "@/utils/i18n";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import DeviceUnknownIcon from "@mui/icons-material/DeviceUnknown";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SearchIcon from "@mui/icons-material/Search";
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

const UserDeviceContent = ({
  session,
  dictionary,
  transactiondata,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactiondata: PageData<UserDeviceType>;
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
  } = useUserDeviceHandler(transactiondata, session, locale);

  const [searchText, setSearchText] = useState<string>("");
  const handleRowDoubleClick = (tx: UserDeviceType) => {
    const id = tx.id;
    if (!id) return;

    const path = getLocalizedUrl("/user-device/view/" + id, locale as Locale);

    window.open(path, "_blank", "noopener,noreferrer");
  };

  return (
    <Box className="mt-5 space-y-5 w-full">
      <Box className="flex gap-4 items-center">
        <TextField
          size="small"
          placeholder="Search by UserCode"
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
                <TableCell>{dictionary["userdevice"].usercode}</TableCell>
                <TableCell>{dictionary["userdevice"].deviceid}</TableCell>
                <TableCell>{dictionary["userdevice"].devicename}</TableCell>
                <TableCell>{dictionary["userdevice"].devicetype}</TableCell>
                <TableCell>{dictionary["userdevice"].status}</TableCell>
                <TableCell>{dictionary["userdevice"].channelid}</TableCell>
                <TableCell>{dictionary["userdevice"].brand}</TableCell>
                <TableCell>{dictionary["userdevice"].ipaddress}</TableCell>
                <TableCell>{dictionary["userdevice"].osversion}</TableCell>
                <TableCell>{dictionary["userdevice"].appversion}</TableCell>
                <TableCell>
                  {dictionary["userdevice"].lastseendateutc}
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
                  <TableCell colSpan={10}>
                    <EmptyListNotice
                      message={dictionary.account.nodatatransactionhistory}
                    />
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
                    <TableCell>{tx.user_code}</TableCell>
                    <TableCell>{tx.device_id}</TableCell>
                    <TableCell>{tx.device_name}</TableCell>
                    <TableCell>
                      {tx.device_type == "ANDROID" ? (
                        <AndroidIcon />
                      ) : tx.device_type == "IOS" ? (
                        <AppleIcon />
                      ) : (
                        <DeviceUnknownIcon />
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.status == "A" ? (
                        <FiberManualRecordIcon
                          sx={{ color: "green", fontSize: 14 }}
                        />
                      ) : (
                        <FiberManualRecordIcon
                          sx={{ color: "red", fontSize: 14 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{tx.channel_id}</TableCell>
                    <TableCell>{tx.brand}</TableCell>
                    <TableCell>{tx.ip_address}</TableCell>
                    <TableCell>{tx.os_version}</TableCell>
                    <TableCell>{tx.app_version}</TableCell>
                    <TableCell>
                      {formatDateTime(tx.last_seen_date_utc.toString())}
                    </TableCell>
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

export default UserDeviceContent;
