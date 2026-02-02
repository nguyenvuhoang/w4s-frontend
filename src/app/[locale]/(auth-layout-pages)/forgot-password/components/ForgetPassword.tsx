import type { Locale } from "@/configs/i18n";
import { Box, NoSsr } from "@mui/material";
// Util Imports
import { env } from "@/env.mjs";
import ForgetPasswordForm from "@features/user/components/ForgetPasswordForm";
import { Typography } from "@mui/material";
import { Session } from "next-auth";
import Footer from "../../shared/Footer";
import Background from "../../shared/Background";
import { getDictionary } from "@/shared/utils/getDictionary";

const ForgetPassword = ({
  session,
  dictionary,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  locale: Locale;
}) => {

  return (
    <>
      <NoSsr>
        <Background>
          <Box className="flex w-full min-h-screen items-center justify-center">
            <Box
              className="z-10 w-full max-w-xl rounded-lg flex flex-col justify-center px-6 sm:px-10 py-10 mx-4"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
                border: '1px solid rgba(15, 23, 42, 0.06)'
              }}
            >
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

              <ForgetPasswordForm session={session} dictionary={dictionary} locale={locale} />

              <Footer />
            </Box>
          </Box>
        </Background>
      </NoSsr>
    </>
  );
};

export default ForgetPassword;
