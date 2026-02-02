"use client";

import { Locale } from "@/configs/i18n";
import ContentWrapper from "@features/dynamicform/components/layout/content-wrapper";
import SchemaIcon from "@mui/icons-material/Schema";
import { Box } from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { AddWorkflowStepForm } from "./AddWorkflowStepForm";

const AddWorkflowStepContent = ({
  session,
  dictionary,
  locale,
}: {
  session: Session | null;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  locale: Locale;
}) => {
  return (
    <ContentWrapper
      title={`${dictionary["addworkflowstep"].title}`}
      description={dictionary["addworkflowstep"].description}
      icon={<SchemaIcon sx={{ fontSize: 40, color: "#225087" }} />}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 5, width: "100%" }}>
        <AddWorkflowStepForm session={session} dictionary={dictionary} locale={locale} />
      </Box>
    </ContentWrapper>
  );
};

export default AddWorkflowStepContent;
