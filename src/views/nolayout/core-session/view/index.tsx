"use client";

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { CoreSessionType } from "@/types/bankType";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import ContentWrapper from "@/views/components/layout/content-wrapper";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WebhookIcon from "@mui/icons-material/Webhook";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { Session } from "next-auth";
import { useMemo } from "react";

const CoreSessionViewContent = ({
  session,
  dictionary,
  transactionnumber,
  viewdata,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactionnumber: string | undefined;
  viewdata: CoreSessionType;
}) => {
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
  const parsedCommandList = useMemo(() => {
      try {
        return JSON.parse(viewdata.command_list || "{}");
      } catch (e) {
        console.error("Invalid JSON in request_data:", e);
        return { error: "Invalid JSON format" };
      }
    }, [viewdata.command_list]);
  return (
    <ContentWrapper
      title={`${dictionary["coresession"].title} - ${dictionary["common"].view}`}
      description={dictionary["coresession"].description}
      icon={<WebhookIcon sx={{ fontSize: 40, color: "#225087" }} />}
      dataref={viewdata.token}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 4, width: "100%" }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
          {/* TRANSACTION INFO */}
          <SectionCard title="Session Info" backgroundColor="#E6F4F1">
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["coresession"].token}
                  value={viewdata.token || "-"}
                />
                <LabelText
                  label={dictionary["coresession"].refreshtoken}
                  value={viewdata.refresh_token || "-"}
                />
                <LabelText
                  label={dictionary["coresession"].reference}
                  value={viewdata.reference || "-"}
                />

                <LabelText
                  label={dictionary["coresession"].userid}
                  value={viewdata.user_id || "-"}
                />

                <LabelText
                  label={dictionary["coresession"].loginname}
                  value={viewdata.login_name || "-"}
                />

                <LabelText
                  label={dictionary["coresession"].branch}
                  value={getBranchName(viewdata.branch_code) || "-"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["coresession"].channel}
                  value={viewdata.channel_id || "-"}
                />
                <LabelText
                  label={dictionary["coresession"].workingdate}
                  value={formatDateTime(viewdata.workingdate.toString()) || "-"}
                />
                <LabelText
                  label={dictionary["coresession"].expiresat}
                  value={formatDateTime(viewdata.expires_at.toString()) || "-"}
                />
                <LabelText
                  label={dictionary["coresession"].createdonutc}
                  value={
                    formatDateTime(viewdata.created_on_utc.toString()) || "-"
                  }
                />
                {/* <LabelText
                  label={dictionary["coresession"].updatedonutc}
                  value={
                    formatDateTime(viewdata.updated_on_utc.toString()) || "-"
                  }
                /> */}
                <LabelText
                  label={dictionary["coresession"].isrevoked}
                  value={
                    <FiberManualRecordIcon
                      sx={{
                        color: viewdata.is_revoked ? "red" : "green",
                        fontSize: 16,
                        paddingTop: 1,
                      }}
                    />
                  }
                />
                <LabelText
                  label={dictionary["coresession"].revokereason}
                  value={viewdata.revoke_reason || "-"}
                />
              </Grid>
            </Grid>
          </SectionCard>

          {/* Command List */}
          <SectionCard title="Command List" backgroundColor="#F5F5F5">
            {/* <Box sx={{ maxHeight: "none", overflow: "visible" }}>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-line",
                  wordBreak: "break-word", // nếu text có 1 dòng rất dài
                }}
              >
                {viewdata.command_list || "-"}
              </Typography>
            </Box> */}
            <JsonEditorComponent
              initialJson={parsedCommandList}
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

export default CoreSessionViewContent;
