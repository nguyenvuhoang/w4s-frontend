"use client";

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { CoreOutboundMessageType } from "@/types/bankType";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import ContentWrapper from "@/views/components/layout/content-wrapper";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReceiptIcon from "@mui/icons-material/Receipt";
import {
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { Session } from "next-auth";
import { useMemo } from "react";
import ScheduleIcon from "@mui/icons-material/Schedule";

const CoreOutboundViewContent = ({
  session,
  dictionary,
  transactionnumber,
  viewdata,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactionnumber: string | undefined;
  viewdata: CoreOutboundMessageType;
}) => {
  const parsedRequestBody = useMemo(() => {
    try {
      return JSON.parse(viewdata.request_body || "{}");
    } catch (e) {
      console.error("Invalid JSON in request_body:", e);
      return { error: "Invalid JSON format" };
    }
  }, [viewdata.request_body]);

  const parsedResponseBody = useMemo(() => {
    try {
      return JSON.parse(viewdata.response_body || "{}");
    } catch (e) {
      console.error("Invalid JSON in response_body:", e);
      return { error: "Invalid JSON format" };
    }
  }, [viewdata.response_body]);

  const statusMap: Record<
    string,
    {
      label: string;
      icon?: React.ReactElement;
      color: "primary" | "error" | "warning" | "default" | "success";
    }
  > = {
    SUCCESS: {
      label: "Success",
      icon: <CheckCircleOutlineIcon />,
      color: "success",
    },
    FAILED: {
      label: "Failed",
      icon: <CancelIcon />,
      color: "error",
    },
    SENDING: {
      label: "Sending",
      icon: <CircularProgress size={14} />,
      color: "warning",
    },
    QUEUED: {
      label: "Queued",
      icon: <ScheduleIcon />,
      color: "default",
    },
    DEAD: {
      label: "Dead",
      icon: <CancelIcon />,
      color: "error",
    },
  };

  return (
    <ContentWrapper
      title={`${dictionary["coreoutbound"].title} - ${dictionary["common"].view}`}
      description={dictionary["coreoutbound"].description}
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
                  label={dictionary["coreoutbound"].executionid}
                  value={viewdata.execution_id || "-"}
                />
                <LabelText
                  label={dictionary["coreoutbound"].reference}
                  value={viewdata.reference || "-"}
                />
                <LabelText
                  label={dictionary["coreoutbound"].messagetype}
                  value={viewdata.message_type || "-"}
                />

                <LabelText
                  label={dictionary["coreoutbound"].targetendpoint}
                  value={viewdata.target_endpoint || "-"}
                />
                <LabelText
                  label={dictionary["coreoutbound"].httpmethod}
                  value={viewdata.http_method || "-"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["coreoutbound"].attemptcount}
                  value={viewdata.attempt_count || "-"}
                />
                <LabelText
                  label={dictionary["coreoutbound"].maxattempt}
                  value={viewdata.max_attempt || "-"}
                />
                <LabelText
                  label={dictionary["coreoutbound"].createdonutc}
                  value={
                    formatDateTime(viewdata.created_on_utc.toString()) || "-"
                  }
                />

                <LabelText
                  label={dictionary["coreoutbound"].nextattemptonutc}
                  value={
                    formatDateTime(viewdata.next_attempt_on_utc.toString()) ||
                    "-"
                  }
                />
                <LabelText
                  label={dictionary["coreoutbound"].updatedonutc}
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
                  <strong>{dictionary["coreoutbound"].status}:</strong>
                </Typography>
                <Chip
                  label={statusMap[viewdata.status].label}
                  color={statusMap[viewdata.status].color}
                  icon={statusMap[viewdata.status].icon}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid size={12}>
                <Typography sx={{ mt: 2 }}>
                  <strong>{dictionary["coreoutbound"].httpstatus}:</strong>
                </Typography>
                <Typography sx={{ color: "#555", whiteSpace: "pre-wrap" }}>
                  {viewdata.http_status || "-"}
                </Typography>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Error Details" backgroundColor="#FEF5F5">
            <Grid container spacing={12}>
              <Grid size={{ xs: 12, md: 12 }}>
                <LabelText
                  label="Error Description"
                  value={viewdata.last_error || "-"}
                />
              </Grid>
            </Grid>
          </SectionCard>

          {/* TECHNICAL */}
          <SectionCard title="Technical Info" backgroundColor="#FAFAFA">
            <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>
              {dictionary["coreoutbound"].requestbody}
            </Typography>
            <JsonEditorComponent
              initialJson={parsedRequestBody}
              onChange={() => {}}
            />
            <br />
            <Typography variant="h6" sx={{ color: "#225087" }} gutterBottom>
              {dictionary["coreoutbound"].responsebody}
            </Typography>
            <JsonEditorComponent
              initialJson={parsedResponseBody}
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

export default CoreOutboundViewContent;
