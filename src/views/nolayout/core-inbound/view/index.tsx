"use client";

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { CoreInboundMessageType } from "@/types/bankType";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import ContentWrapper from "@/views/components/layout/content-wrapper";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { Box, Chip, Grid, Paper, Typography } from "@mui/material";
import { Session } from "next-auth";
import { useMemo } from "react";
import DoneAllIcon from "@mui/icons-material/DoneAll";

const CoreInboundViewContent = ({
  session,
  dictionary,
  transactionnumber,
  viewdata,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactionnumber: string | undefined;
  viewdata: CoreInboundMessageType;
}) => {
  const parsedHeader = useMemo(() => {
    try {
      return JSON.parse(viewdata.headers || "{}");
    } catch (e) {
      console.error("Invalid JSON in headers:", e);
      return { error: "Invalid JSON format" };
    }
  }, [viewdata.headers]);
  const parsedRequestBody = useMemo(() => {
    try {
      return JSON.parse(viewdata.request_body || "{}");
    } catch (e) {
      console.error("Invalid JSON in request_body:", e);
      return { error: "Invalid JSON format" };
    }
  }, [viewdata.request_body]);

  const parsedRequestData = useMemo(() => {
    try {
      return JSON.parse(viewdata.request_data || "{}");
    } catch (e) {
      console.error("Invalid JSON in request_data:", e);
      return { error: "Invalid JSON format" };
    }
  }, [viewdata.request_data]);

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
    <ContentWrapper
      title={`${dictionary["coreinbound"].title} - ${dictionary["common"].view}`}
      description={dictionary["coreinbound"].description}
      icon={<ReceiptIcon sx={{ fontSize: 40, color: "#225087" }} />}
      dataref={viewdata.execution_id}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 4, width: "100%" }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
          {/* TRANSACTION INFO */}
          <SectionCard title="Transaction Info" backgroundColor="#E6F4F1">
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["coreinbound"].executionid}
                  value={viewdata.execution_id || "-"}
                />
                <LabelText
                  label={dictionary["coreinbound"].endtoend}
                  value={viewdata.end_to_end || "-"}
                />
                <LabelText
                  label={dictionary["coreinbound"].transactioncode}
                  value={viewdata.transaction_code || "-"}
                />

                <LabelText
                  label={dictionary["coreinbound"].createdonutc}
                  value={
                    formatDateTime(viewdata.created_on_utc.toString()) || "-"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["coreinbound"].channel}
                  value={viewdata.channel_id || "-"}
                />
                <LabelText
                  label={dictionary["coreinbound"].service}
                  value={viewdata.service_id || "-"}
                />
                <LabelText
                  label={dictionary["coreinbound"].signatureverified}
                  value={
                    viewdata.signature_verified ? (
                      <CheckCircleOutlineIcon
                        color="success"
                        sx={{ verticalAlign: "middle", fontSize: 18, marginBottom: 1 }}
                      />
                    ) : (
                      <CancelIcon
                        color="error"
                        sx={{ verticalAlign: "middle", fontSize: 18, marginBottom: 1 }}
                      />
                    )
                  }
                />
                <LabelText
                  label={dictionary["coreinbound"].updatedonutc}
                  value={
                    formatDateTime(viewdata.updated_on_utc.toString()) || "-"
                  }
                />
              </Grid>
            </Grid>
          </SectionCard>

          {/* STATUS & RESULT */}
          <SectionCard title="Status & Result" backgroundColor="#F5F5F5">
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography sx={{ mt: 2 }}>
                  <strong>{dictionary["coreinbound"].status}:</strong>
                </Typography>
                <Chip
                  label={statusMap[viewdata.status].label}
                  color={statusMap[viewdata.status].color}
                  icon={statusMap[viewdata.status].icon}
                  sx={{ mt: 1 }}
                />
              </Grid>
              {/* <Grid size={12}>
                <Typography sx={{ mt: 2 }}>
                  <strong>
                    {dictionary["coreinbound"].errordescription}
                  </strong>
                </Typography>
                <Typography sx={{ color: "#555", whiteSpace: "pre-wrap" }}>
                  {viewdata.error_description}
                </Typography>
              </Grid> */}
            </Grid>
          </SectionCard>

          <SectionCard title="Error Details" backgroundColor="#FEF5F5">
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label="Error Code"
                  value={viewdata.error_code || "-"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label="Error Description"
                  value={viewdata.error_description || "-"}
                />
              </Grid>
            </Grid>
          </SectionCard>

          {/* TECHNICAL */}
          <SectionCard title="Technical Info" backgroundColor="#FAFAFA">
            <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>
              {dictionary["coreinbound"].headers}
            </Typography>
            <JsonEditorComponent
              initialJson={parsedHeader}
              onChange={() => {}}
            />
            <br/>
            <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>
              {dictionary["coreinbound"].requestbody}
            </Typography>
            <JsonEditorComponent
              initialJson={parsedRequestBody}
              onChange={() => {}}
            />
            <br/>
            <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>
              {dictionary["coreinbound"].requestdata}
            </Typography>
            <JsonEditorComponent
              initialJson={parsedRequestData}
              onChange={() => {}}
            />
          </SectionCard>
        </Paper>
      </Box>
    </ContentWrapper>
  );
};

const SectionCard = ({
  title,
  children,
  backgroundColor = "#F9F9F9",
}: {
  title: string;
  children: React.ReactNode;
  backgroundColor?: string;
}) => (
  <Box
    sx={{
      backgroundColor,
      borderRadius: 2,
      mb: 4,
      overflow: "hidden",
      boxShadow: 1,
    }}
  >
    <Box
      sx={{
        backgroundColor: "#225087",
        px: 3,
        py: 2,
      }}
    >
      <Typography variant="h6" color="white" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Box>
);

const LabelText = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Typography sx={{ mb: 1 }}>
    <Box component="span" sx={{ fontWeight: 600, fontFamily: "Quicksand" }}>
      {label}:
    </Box>{" "}
    <Box component="span" sx={{ fontWeight: 400, fontFamily: "Quicksand" }}>
      {value}
    </Box>
  </Typography>
);

export default CoreInboundViewContent;
