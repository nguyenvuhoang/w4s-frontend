"use client";

import { UserDeviceType } from "@/types/bankType";
import { formatDateTime } from "@/utils/formatDateTime";
import { getDictionary } from "@/utils/getDictionary";
import ContentWrapper from "@/views/components/layout/content-wrapper";
import { SystemSecurityUpdateGood } from "@mui/icons-material";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeviceUnknownIcon from "@mui/icons-material/DeviceUnknown";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { Session } from "next-auth";

const UserDeviceViewContent = ({
  session,
  dictionary,
  transactionnumber,
  viewdata,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  transactionnumber: string | undefined;
  viewdata: UserDeviceType;
}) => {
  return (
    <ContentWrapper
      title={`${dictionary["userdevice"].title} - ${dictionary["common"].view}`}
      description={dictionary["userdevice"].description}
      icon={<SystemSecurityUpdateGood sx={{ fontSize: 40, color: "#225087" }} />}
      dataref={viewdata.user_code}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 4, width: "100%" }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
          {/* TRANSACTION INFO */}
          <SectionCard title="User Device Info" backgroundColor="#E6F4F1">
            <Grid container spacing={12}>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["userdevice"].usercode}
                  value={viewdata.user_code || "-"}
                />
                <LabelText
                  label={dictionary["userdevice"].deviceid}
                  value={viewdata.device_id || "-"}
                />
                <LabelText
                  label={dictionary["userdevice"].devicename}
                  value={viewdata.device_name || "-"}
                />

                <LabelText
                  label={dictionary["userdevice"].devicetype}
                  value={
                    viewdata.device_type == "ANDROID" ? (
                      <AndroidIcon
                        sx={{
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 25,
                        }}
                      />
                    ) : viewdata.device_type == "IOS" ? (
                      <AppleIcon
                        sx={{
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 25,
                        }}
                      />
                    ) : (
                      <DeviceUnknownIcon
                        sx={{
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 25,
                        }}
                      />
                    )
                  }
                />

                <LabelText
                  label={dictionary["userdevice"].channelid}
                  value={viewdata.channel_id || "-"}
                />

                <LabelText
                  label={dictionary["userdevice"].brand}
                  value={viewdata.brand || "-"}
                />

                <LabelText
                  label={dictionary["userdevice"].lastseendateutc}
                  value={
                    formatDateTime(viewdata.last_seen_date_utc.toString()) ||
                    "-"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LabelText
                  label={dictionary["userdevice"].ipaddress}
                  value={viewdata.ip_address || "-"}
                />
                <LabelText
                  label={dictionary["userdevice"].osversion}
                  value={viewdata.os_version || "-"}
                />
                <LabelText
                  label={dictionary["userdevice"].appversion}
                  value={viewdata.app_version || "-"}
                />
                <LabelText
                  label={dictionary["userdevice"].status}
                  value={
                    <FiberManualRecordIcon
                      sx={{
                        color: viewdata.status == "A" ? "green" : "red",
                        fontSize: 16,
                        paddingTop: 1,
                      }}
                    />
                  }
                />
                <LabelText
                  label={dictionary["userdevice"].isemulator}
                  value={
                    viewdata.is_emulator ? (
                      <CheckIcon
                        sx={{
                          color: "green",
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 24,
                        }}
                      />
                    ) : (
                      <CloseIcon
                        sx={{
                          color: "red",
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 24,
                        }}
                      />
                    )
                  }
                />
                <LabelText
                  label={dictionary["userdevice"].isrootedorjailbroken}
                  value={
                    viewdata.is_rooted_or_jailbroken ? (
                      <CheckIcon
                        sx={{
                          color: "green",
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 24,
                        }}
                      />
                    ) : (
                      <CloseIcon
                        sx={{
                          color: "red",
                          verticalAlign: "middle",
                          paddingBottom: 1,
                          fontSize: 24,
                        }}
                      />
                    )
                  }
                />
                <LabelText
                  label={dictionary["userdevice"].useragent}
                  value={viewdata.user_agent || "-"}
                />
                {/* <LabelText
                  label={dictionary["userdevice"].isrevoked}
                  value={
                    <FiberManualRecordIcon
                      sx={{
                        color: viewdata.is_revoked ? "red" : "green",
                        fontSize: 16,
                        paddingTop: 1,
                      }}
                    />
                  }
                /> */}
              </Grid>
            </Grid>
          </SectionCard>
          <SectionCard title="Push ID Info" backgroundColor="#E6F4F1">
            <Grid container spacing={12}>
              <Grid size={{ xs: 12, md: 12 }}>
                <LabelText
                  label={dictionary["userdevice"].pushid}
                  value={viewdata.push_id || "-"}
                />
              </Grid>
            </Grid>
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

export default UserDeviceViewContent;
