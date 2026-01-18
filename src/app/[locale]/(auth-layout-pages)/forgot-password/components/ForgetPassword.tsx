import type { Locale } from "@/configs/i18n";
import { Box, NoSsr } from "@mui/material";
// Util Imports
import { env } from "@/env.mjs";
import ForgetPasswordForm from "@features/user/components/ForgetPasswordForm";
import { getDictionary } from "@/utils/getDictionary";
import { Typography } from "@mui/material";
import { Session } from "next-auth";
import Center from "../../shared/Center";
import Footer from "../../shared/Footer";
import LeftSide from "../../shared/LeftSide";

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
        <Box className="flex w-full h-screen">
          {/* Left Side - Background Image */}
          <LeftSide />
          <Center>
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
          </Center>
        </Box>
      </NoSsr>
    </>
  );
};

export default ForgetPassword;
