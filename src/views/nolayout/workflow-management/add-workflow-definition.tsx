"use client";

import ContentWrapper from "@features/dynamicform/components/layout/content-wrapper";
import SchemaIcon from "@mui/icons-material/Schema";
import { Box } from "@mui/material";
import { getDictionary } from "@utils/getDictionary";
import { Session } from "next-auth";
import { AddWorkflowDefinitionForm } from "./AddWorkflowDefinitionForm";
import { Locale } from "@/configs/i18n";

const AddWorkflowDefinitionContent = ({
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
      title={`${dictionary["addworkflowdefinition"].title}`}
      description={dictionary["addworkflowdefinition"].description}
      icon={<SchemaIcon sx={{ fontSize: 40, color: "#225087" }} />}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 5, width: "100%" }}>
        <AddWorkflowDefinitionForm session={session} dictionary={dictionary} locale={locale} />
      </Box>
    </ContentWrapper>
  );
};

export default AddWorkflowDefinitionContent;

