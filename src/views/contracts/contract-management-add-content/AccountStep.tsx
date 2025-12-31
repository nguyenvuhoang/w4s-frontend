"use client";

import CustomDataGrid from "@/@core/components/mui/CustomDataGrid";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_TABLE_FORMAT,
  ACCOUNT_TYPE_LABELS,
} from "@/data/meta";
import { PageContentProps } from "@/types";
import SwalAlert from "@/utils/SwalAlert";
import {
  Box,
  Button,
  FormControl,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Swal from "sweetalert2";

const AccountStep = ({
  dictionary,
  onAccountApplied,
}: PageContentProps & { onAccountApplied?: () => void }) => {
  const { getValues, setValue } = useFormContext();

  const fields = [
    { name: "cifnumber", label: dictionary["contract"].cifnumber },
    { name: "fullname", label: dictionary["contract"].fullname },
    { name: "phone", label: dictionary["contract"].phonenumber },
    { name: "email", label: "Email" },
  ];

  const commonTextFieldSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#048d48a1 !important",
        filter: "invert(0%) !important",
        WebkitFilter: "invert(0%) !important",
      },
      "&:hover fieldset": {
        borderColor: "#8e8e8e !important",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#03492a !important",
      },
      "&.Mui-error fieldset": {
        borderColor: "#d32f2f !important",
      },
    },
    "& .MuiInputBase-input": {
      color: "inherit",
    },
  };

  const inputLabelSlotProps = {
    shrink: true,
    sx: {
      "& .MuiInputLabel-asterisk": {
        color: "red",
      },
    },
  };

  const [leftItems, setLeftItems] = useState<any[]>([]);

  useEffect(() => {
    const account = getValues("account") || [];
    if (account.length > 0) {
      setLeftItems(
        account.map((row: any, index: number) => ({ id: index, ...row }))
      );
    } else {
      onAccountApplied?.();
    }
  }, [getValues]);

  const [rightItems, setRightItems] = useState<any[]>([]);
  const [leftSelectedRows, setLeftSelectedRows] = useState<any[]>([]);
  const [rightSelectedRows, setRightSelectedRows] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePrimarySelect = (id: number) => {
    setRightItems((prev) =>
      prev.map((item) => ({
        ...item,
        isprimary: item.id === id ? "true" : "false",
      }))
    );
  };

  const columns = ACCOUNT_TABLE_FORMAT.map((column: any) => {
    if (column.field === "isprimary") {
      column.renderCell = (params: any) => {
        return (
          <input
            type="radio"
            name="isprimary"
            checked={params.row.isprimary === "true"}
            onChange={() => handlePrimarySelect(params.row.id)}
          />
        );
      };
    }

    if (column.field === "accounttype") {
      column.renderCell = (params: any) =>
        ACCOUNT_TYPE_LABELS[params.row.accounttype] || params.row.accounttype;
    }

    if (column.field === "status") {
      column.renderCell = (params: any) =>
        ACCOUNT_STATUS_LABELS[params.row.status] || params.row.accountstatus;
    }

    return column;
  });

  const handleOneClick = () => {
    const selected = leftSelectedRows.map((id: number) =>
      leftItems.find((item) => item.id === id)
    );
    const filtered = selected.filter(
      (item) =>
        item && !rightItems.some((r) => r.accountnumber === item.accountnumber)
    );

    setRightItems((prev) => [...prev, ...filtered]);

    setLeftItems((prev) =>
      prev.filter((item) => !leftSelectedRows.includes(item.id))
    );
    setLeftSelectedRows([]);
  };

  const handleAllClick = () => {
    const filtered = leftItems.filter(
      (item) => !rightItems.some((r) => r.accountnumber === item.accountnumber)
    );

    setRightItems((prev) => [...prev, ...filtered]);
    setLeftItems([]);
    setLeftSelectedRows([]);
  };

  const handleOneReturnClick = () => {
    const selected = rightSelectedRows.map((id: number) =>
      rightItems.find((item) => item.id === id)
    );
    const filtered = selected.filter(
      (item) =>
        item && !leftItems.some((l) => l.accountnumber === item.accountnumber)
    );

    setLeftItems((prev) => [...prev, ...filtered]);

    setRightItems((prev) =>
      prev.filter((item) => !rightSelectedRows.includes(item.id))
    );
    setRightSelectedRows([]);
  };

  const handleAllReturnClick = () => {
    const filtered = rightItems.filter(
      (item) => !leftItems.some((l) => l.accountnumber === item.accountnumber)
    );

    setLeftItems((prev) => [...prev, ...filtered]);
    setRightItems([]);
    setRightSelectedRows([]);
  };

  const handleApplyClick = () => {
    Swal.fire({
      position: "center",
      color: "black",
      allowOutsideClick: false,
      text: dictionary["common"].areyousuresubmit,
      showCancelButton: true,
      cancelButtonText: dictionary["common"].cancel,
      confirmButtonText: dictionary["common"].submit,
      iconHtml:
        '<img src="/images/icon/warning.svg" alt="custom-icon" style="width:64px; height:64px;">',
      customClass: {
        cancelButton: "swal2-cancel",
        confirmButton: "swal2-confirm",
        icon: "no-border",
      },
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const hasData = rightItems.length > 0;
        const hasPrimary = rightItems.some(
          (item: any) => item.isprimary === "true" || item.isprimary === "1"
        );
        if (hasData && !hasPrimary) {
          SwalAlert("error", dictionary["account"]?.primaryrequired, "center");
          return;
        }

        const transformedData = rightItems?.map(
          (item: {
            accountnumber: any;
            isprimary: string;
            currency: any;
            accounttype: any;
            status: any;
            branchid: any;
            bankaccounttype: any;
            accountname: any;
          }) => ({
            accountnumber: item.accountnumber,
            isprimary: item.isprimary === "false" ? "0" : "1",
            currencycode: item.currency,
            accounttype: item.accounttype,
            status: item.status,
            branchid: item.branchid,
            bankaccounttype: item.bankaccounttype,
            accountname: item.accountname,
            bankid: "",
          })
        );

        setValue("accountselected", transformedData);
        setIsSubmitted(true);
        SwalAlert(
          "success",
          dictionary["common"].datachange.replace("{0}", ""),
          "center"
        );
        onAccountApplied?.();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        console.log("Hủy thao tác");
      }
    });
  };

  return (
    <Grid container spacing={5}>
      {fields?.map((field, index) => (
        <Grid key={index} size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            disabled
            label={field.label}
            value={getValues(field.name)}
            sx={commonTextFieldSx}
            slotProps={{ inputLabel: inputLabelSlotProps }}
            size="small"
          />
        </Grid>
      ))}

      <Grid size={{ xs: 12 }} sx={{ marginTop: "16px" }}>
        <Grid container spacing={2} alignItems="center">
          {/* Cột bên trái */}
          <Grid size={{ xs: 5 }}>
            <FormControl fullWidth size="small">
              <Box
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                <Typography variant="h5" className="text-[#0B9150]">
                  {`${dictionary["contract"].currentaccount}`}
                </Typography>
                <Box style={{ height: 400, width: "100%" }}>
                  <CustomDataGrid
                    rows={leftItems}
                    columns={columns}
                    checkboxSelection
                    onCellClick={(params, event) => {
                      if (params.field === "isprimary") {
                        event.stopPropagation();
                      }
                    }}
                    rowSelectionModel={leftSelectedRows}
                    onRowSelectionModelChange={(newSelection) => {
                      setLeftSelectedRows([...newSelection]);
                    }}
                  />
                </Box>
              </Box>
            </FormControl>
          </Grid>

          {/* Cột nút ở giữa */}
          <Grid
            size={{ xs: 2 }}
            container
            justifyContent="center"
            alignItems="center"
            direction="column"
            gap={2}
          >
            {/* Nút thêm từng dòng */}
            <Button
              variant="outlined"
              onClick={handleOneClick}
              disabled={isSubmitted}
            >
              →
            </Button>

            {/* Nút thêm tất cả */}
            <Button
              variant="outlined"
              onClick={handleAllClick}
              disabled={isSubmitted}
            >
              ⇒
            </Button>
            {/* Nút bỏ từng dòng */}
            <Button
              variant="outlined"
              onClick={handleOneReturnClick}
              disabled={isSubmitted}
            >
              ←
            </Button>

            {/* Nút bỏ tất cả */}
            <Button
              variant="outlined"
              onClick={handleAllReturnClick}
              disabled={isSubmitted}
            >
              ⇐
            </Button>

            <Button
              variant="contained"
              sx={{
                backgroundColor: "#0D9252",
                color: "#FFFFFF",
                marginTop: "20px",
                "&:hover": {
                  backgroundColor: "#0B7E45",
                },
              }}
              disabled={isSubmitted || rightItems.length === 0}
              onClick={handleApplyClick}
            >
              {dictionary["common"].apply || "Apply"}
            </Button>
          </Grid>

          {/* Cột bên phải */}
          <Grid size={{ xs: 5 }}>
            <FormControl fullWidth size="small">
              <Box
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                <Typography variant="h5" className="text-[#0B9150]">
                  {`${dictionary["contract"].accountchoose}`}
                </Typography>
                <Box style={{ height: 400, width: "100%" }}>
                  <CustomDataGrid
                    rows={rightItems}
                    columns={columns}
                    checkboxSelection
                    onRowSelectionModelChange={(newSelection) => {
                      setRightSelectedRows([...newSelection]);
                    }}
                    rowSelectionModel={rightSelectedRows}
                  />
                </Box>
              </Box>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AccountStep;
