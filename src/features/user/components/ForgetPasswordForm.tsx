"use client";

import type { Locale } from "@/configs/i18n";
import { Box } from "@mui/material";
// Util Imports
import LoadingSubmit from "@components/LoadingSubmit";
import { getDictionary } from "@utils/getDictionary";
import { Button, TextField, Typography } from "@mui/material";
import { Session } from "next-auth";
import Link from "next/link";
import { FormProvider } from "react-hook-form";
import { useForgetPasswordForm } from "../hooks/useForgetPasswordForm";
import { getLocalizedUrl } from "@utils/i18n";

const ForgetPasswordForm = ({
  session,
  dictionary,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  locale: Locale;
}) => {
  const { methods, loading, onSubmit } = useForgetPasswordForm(dictionary);
  const { handleSubmit } = methods;

  return (
    <>
      {loading ? (
        <LoadingSubmit loadingtext={dictionary["common"].loading} />
      ) : (
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
                loading={loading}
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
                  href={getLocalizedUrl("/login", locale)}
                  style={{
                    textDecoration: "none",
                    color: "green",
                    fontSize: "14px",
                  }}
                >
                  â† {dictionary["auth"].backtologin}
                </Link>
              </Typography>
            </Box>
          </form>
        </FormProvider>
      )}
    </>
  );
};

export default ForgetPasswordForm;

