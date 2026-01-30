import { auth } from "@/auth";
import Spinner from "@components/spinners";
import { Locale } from "@/configs/i18n";
import { LogType } from "@/data/meta";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { systemServiceApi } from "@/servers/system-service";
import { PageData } from "@shared/types/systemTypes";
import { getDictionary } from "@utils/getDictionary";
import { isValidResponse } from "@utils/isValidResponse";
import AddWorkflowDefinitionContent from "@/views/nolayout/workflow-management/add-workflow-definition";
import { Suspense } from "react";

type Params = Promise<{
  locale: Locale;
}>;

const WorkflowDefinitionPage = async ({ params }: { params: Params }) => {
  const { locale } = await params;

  const [dictionary, session] = await Promise.all([
    getDictionary(locale),
    auth(),
  ]);

  return (
    <Suspense fallback={<Spinner />}>
      <AddWorkflowDefinitionContent dictionary={dictionary} session={session} />
    </Suspense>
  );
};

export default WorkflowDefinitionPage;
