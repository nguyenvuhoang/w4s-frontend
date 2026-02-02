import { auth } from "@/auth";
import { Locale } from "@/configs/i18n";
import AddWorkflowStepContent from "@/views/nolayout/workflow-management/add-workflow-step";
import Spinner from "@components/spinners";
import { getDictionary } from "@utils/getDictionary";
import { Suspense } from "react";

type Params = Promise<{
  locale: Locale;
}>;

const WorkflowStepPage = async ({ params }: { params: Params }) => {
  const { locale } = await params;

  const [dictionary, session] = await Promise.all([
    getDictionary(locale),
    auth(),
  ]);

  return (
    <Suspense fallback={<Spinner />}>
      <AddWorkflowStepContent dictionary={dictionary} session={session} locale={locale} />
    </Suspense>
  );
};

export default WorkflowStepPage;
