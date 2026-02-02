import { auth } from '@/auth';
import { generateAuthMetadata } from '@components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi, workflowService } from '@/servers/system-service';
import { getDictionary } from '@utils/getDictionary';
import { isValidResponse } from '@utils/isValidResponse';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import WorkflowManagementContent from '@/views/nolayout/workflow-management';
import WorkflowManagementError from '@/views/nolayout/workflow-management/WorkflowManagementError';
import WorkflowManagementSkeleton from '@/views/nolayout/workflow-management/WorkflowManagementSkeleton';
import SchemaIcon from '@mui/icons-material/Schema';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { Suspense } from 'react';

export const metadata: Metadata = generateAuthMetadata('Workflow Management');

const WorkflowManagementData = async ({
  session,
  locale,
  dictionary
}: {
  session: Session | null;
  locale: Locale;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
}) => {
  const workflowDataApi = await workflowService.searchWorkflowDefinition({
    sessiontoken: session?.user?.token as string,
    pageindex: 0,
    pagesize: 10,
    searchtext: '',
    language: locale as Locale
  });

  if (
    !isValidResponse(workflowDataApi) ||
    (workflowDataApi.payload?.dataresponse?.errors && workflowDataApi.payload.dataresponse.errors.length > 0)
  ) {
    const error = workflowDataApi.payload?.dataresponse?.errors?.[0];
    const executionId = error?.execute_id;
    const errorInfo = error?.info;

    return (
      <WorkflowManagementError
        executionId={executionId}
        errorInfo={errorInfo}
        dictionary={dictionary}
      />
    );
  }

  const workflowData = (workflowDataApi.payload?.dataresponse as any)?.data;
  return (
    <WorkflowManagementContent
      session={session}
      dictionary={dictionary}
      locale={locale}
      initialData={workflowData}
    />
  );
};

const WorkflowManagementPage = async (props: { params: Promise<{ locale: Locale }> }) => {
  const { locale } = await props.params;

  const [dictionary, session] = await Promise.all([
    getDictionary(locale),
    auth()
  ]);

  return (
    <ContentWrapper
      title={dictionary['workflow']?.title || 'Workflow Management'}
      description={dictionary['workflow']?.description || 'Manage workflow definitions and steps'}
      icon={<SchemaIcon sx={{ fontSize: 40, color: '#215086' }} />}
      dictionary={dictionary}
      issearch={true}
    >
      <Suspense fallback={<WorkflowManagementSkeleton dictionary={dictionary} />}>
        <WorkflowManagementData session={session} locale={locale} dictionary={dictionary} />
      </Suspense>
    </ContentWrapper>
  );
};

export default WorkflowManagementPage;
