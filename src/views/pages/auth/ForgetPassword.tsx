"use client";

import { useImageVariant } from "@/@core/hooks/useImageVariant";
import type { Locale } from "@/configs/i18n";
import type { Mode } from "@core/types";
import { Box, NoSsr, useTheme } from "@mui/material";
import Image from "next/image";
// Util Imports
import { getDictionary } from "@/utils/getDictionary";
import { Button, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dataService, workflowService } from "@/servers/system-service";
import SwalAlert from "@/utils/SwalAlert";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { isValidResponse } from "@/utils/isValidResponse";
import { Spinner } from "@react-pdf-viewer/core";
import { env } from "@/env.mjs";
import theme from "@/@core/theme";
import LoadingSubmit from "@/components/LoadingSubmit";
import { set } from "lodash";

const ForgetPassword = ({
  mode,
  dictionary,
  locale,
}: {
  mode: Mode;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  locale: Locale;
}) => {
  const darkImg = "/images/pages/login-night.jpg";
  const lightImg = "/images/pages/login-day.jpg";
  const authBackground = useImageVariant(mode, lightImg, darkImg);

  const darklogo = "/images/logobank/emi.svg";
  const lightlogo = "/images/logobank/emi.svg";
  const logo = useImageVariant(mode, lightlogo, darklogo);

  //hook
  const router = useRouter();
  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const theme = useTheme();

  const { handleSubmit } = methods;
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    handleResetPassword(data);
  };

  const handleResetPassword = async (data: any) => {
    try {
      setLoading(true);
      const dataviewAPI = await dataService.viewData({
        sessiontoken: "",
        learnapi: "cbs_workflow_execute",
        workflowid: "BO_EXECUTE_SQL_WITHOUT_LOGIN_CTH",
        commandname: "getUserByUserName",
        issearch: false,
        parameters: { id: data.username },
      });
      const viewdata = dataviewAPI.payload.dataresponse.fo[0].input.data[0];
      if (
        !isValidResponse(dataviewAPI) ||
        (dataviewAPI.payload.dataresponse.error &&
          dataviewAPI.payload.dataresponse.error.length > 0)
      ) {
        console.log(
          "ExecutionID:",
          dataviewAPI.payload.dataresponse.error[0].execute_id +
            " - " +
            dataviewAPI.payload.dataresponse.error[0].info
        );
        SwalAlert(
          "error",
          dataviewAPI.payload.dataresponse.error[0].info as string,
          "center"
        );
        return <Spinner />;
      } else if (!viewdata) {
        SwalAlert("error", "User is not exist!", "center");
        return <Spinner />;
      } else if (viewdata.email !== data.email) {
        SwalAlert(
          "error",
          "Email is incorrect!\nPlease enter your registered email!",
          "center"
        );
        return <Spinner />;
      } else {
        const response = await workflowService.runBODynamic({
          sessiontoken: "",
          txFo: {
            bo: [
              {
                use_microservice: true,
                input: {
                  workflowid: "BO_USER_RESET_PASSWORD",
                  learn_api: "cbs_workflow_execute",
                  fields: {
                    usercode: viewdata.usercode,
                    email: data.email,
                  },
                },
              },
            ],
          },
        });
        if (response.status === 200 && response.payload?.dataresponse?.fo) {
          const foArray = response.payload.dataresponse.fo;
          const hasErrorFo = foArray.find(
            (item: any) => item.input?.error_code === "ERROR"
          );
          if (hasErrorFo) {
            let errorMsg = hasErrorFo.input?.error_message ?? "Unknown error";
            try {
              const jsonMatch = errorMsg.match(/{.*}/);
              if (jsonMatch) {
                const jsonError = JSON.parse(jsonMatch[0]);
                errorMsg = jsonError.error_message || errorMsg;
              }
            } catch (_) {}
            SwalAlert("error", errorMsg, "center");
            return;
          }
          SwalAlert(
            "success",
            dictionary["auth"].resetpasswordsuccess,
            "center",
            false,
            false,
            true,
            () => {
              router.push("/login"); // 👈 chuyển sang trang login
            }
          );
        } else {
          SwalAlert("error", response.payload.error[0].info, "center");
        }
      }
    } catch (err) {
      SwalAlert(
        "error",
        err instanceof Error ? err.message : "An error occurred",
        "center"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NoSsr>
        <Box className="flex w-full h-screen">
          {/* Left Side - Background Image */}
          <Box
            className="hidden md:block w-[70%] h-full"
            sx={{
              backgroundImage: `url(${authBackground})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          {loading ? (
            <LoadingSubmit loadingtext={dictionary["common"].loading} />
          ) : (
            <Box className="w-full md:w-[30%] h-full bg-white flex flex-col justify-center px-6 sm:px-10 py-10 relative">
              {/* Logo */}
              <Box
                sx={{
                  position: "relative",
                  width: 200,
                  height: 67,
                  mx: "auto", // center horizontally
                  mb: 8,
                }}
              >
                <Image
                  src={logo}
                  alt="EMI Logo"
                  width={200}
                  height={67}
                  style={{ objectFit: "contain" }}
                  className="mx-auto"
                />
              </Box>

              {/* Title + Welcome */}
              <Box className="space-y-12 text-center body font-sans">
                <Box className="space-y-1 body-header">
                  <Typography
                    variant="h2"
                    className="font-sans text-[#00502F]"
                    sx={{ fontFamily: "Quicksand" }}
                  >
                    {env.NEXT_PUBLIC_APPLICATION_TITLE}
                  </Typography>
                  <Box
                    className="text-16-medium text-[#00502F]"
                    sx={{ fontFamily: "Quicksand" }}
                  >
                    {dictionary["auth"].forgotpassword}
                  </Box>
                </Box>
              </Box>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Box
                    sx={{
                      maxWidth: 600,
                      margin: "0 auto",
                      backgroundColor: "#ffffff",
                      borderRadius: 4,
                      boxShadow: 3,
                      p: 4,
                      height: "103%",
                    }}
                  >
                    {/* <Typography
                    variant="h5"
                    component="h2"
                    sx={{ textAlign: "center", mb: 3, fontWeight: "bold" }}
                  >
                    Reset Password
                  </Typography> */}

                    {/* Username */}
                    <TextField
                      fullWidth
                      margin="normal"
                      label={dictionary["auth"].username}
                      {...methods.register("username", {
                        required: "Username is required",
                      })}
                      error={!!methods.formState.errors.username}
                      helperText={
                        methods.formState.errors.username?.message as string
                      }
                    />

                    {/* Email */}
                    <TextField
                      fullWidth
                      margin="normal"
                      label={dictionary["auth"].email}
                      type="email"
                      {...methods.register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Invalid email format",
                        },
                      })}
                      error={!!methods.formState.errors.email}
                      helperText={
                        methods.formState.errors.email?.message as string
                      }
                    />

                    {/* Confirm Button */}
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ marginTop: 10 }}
                      fullWidth
                      onClick={async () => {
                        const isValid = await methods.trigger();
                        if (!isValid) return;
                        const data = methods.getValues();
                        onSubmit(data);
                      }}
                    >
                      {dictionary["common"].confirm}
                    </Button>

                    <Typography
                      variant="body2"
                      sx={{ textAlign: "right", mt: 2 }}
                    >
                      <Link
                        replace
                        href="/login"
                        style={{
                          textDecoration: "none",
                          color: "green",
                          fontSize: "14px",
                        }}
                      >
                        ← {dictionary["auth"].backtologin}
                      </Link>
                    </Typography>
                  </Box>
                </form>
              </FormProvider>

              <Box
                sx={{
                  position: "absolute",
                  bottom: 8,
                  right: 16,
                  fontSize: "16px",
                  color: theme.palette.primary.main,
                  opacity: 0.7,
                  fontFamily: "Quicksand, sans-serif",
                }}
              >
                v{env.NEXT_PUBLIC_VERSION} - {env.NEXT_PUBLIC_ENVIRONMENT}
              </Box>
            </Box>
          )}
        </Box>
      </NoSsr>
    </>
  );
};

export default ForgetPassword;
