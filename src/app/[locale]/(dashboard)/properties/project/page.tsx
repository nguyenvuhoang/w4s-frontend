import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ProjectContextPage from '@/features/properties/project/ProjectContextPage'

type Params = Promise<{
    locale: Locale
}>

// Business Project screen: only the working-project context (full management: /system-settings/projects).
const ProjectPage = async ({ params }: { params: Params }) => {
    const resolvedParams = await params

    return (
        <AuthorizedLayout requiredPath="/properties/project" params={resolvedParams}>
            {({ dictionary }) => <ProjectContextPage dictionary={dictionary} />}
        </AuthorizedLayout>
    )
}

export default ProjectPage
