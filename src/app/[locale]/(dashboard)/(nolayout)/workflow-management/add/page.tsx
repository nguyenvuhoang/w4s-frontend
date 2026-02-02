import { auth } from "@/auth";
import Spinner from "@components/spinners";
import { Locale } from "@/configs/i18n";
import { getDictionary } from "@utils/getDictionary";
import { AddWorkflowWizard } from "@/views/nolayout/workflow-management/AddWorkflowWizard";
import { Suspense } from "react";

type Params = Promise<{
    locale: Locale;
}>;

const AddWorkflowWizardPage = async ({ params }: { params: Params }) => {
    const { locale } = await params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <AddWorkflowWizard dictionary={dictionary} session={session} locale={locale} />
        </Suspense>
    );
};

export default AddWorkflowWizardPage;
