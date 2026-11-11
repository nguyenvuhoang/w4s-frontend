import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import StackingPlanPage from '@/features/properties/stacking-plan/StackingPlanPage'

type Params = Promise<{
    locale: Locale
}>

const StackingPlanRoutePage = async ({ params }: { params: Params }) => {
    const resolvedParams = await params

    return (
        <AuthorizedLayout requiredPath="/properties/stacking-plan" params={resolvedParams}>
            {({ dictionary }) => <StackingPlanPage dictionary={dictionary} />}
        </AuthorizedLayout>
    )
}

export default StackingPlanRoutePage
