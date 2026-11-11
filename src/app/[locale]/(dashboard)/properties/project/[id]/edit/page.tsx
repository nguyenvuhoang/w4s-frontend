import { Locale } from '@/configs/i18n'
import { renderProjectDetailRoute } from '@/features/properties/project/projectDetailRoute.server'

type Params = Promise<{
    locale: Locale
    id: string
}>

// Business "Modify": the project detail with its edit form opened (MODIFY right required).
const ProjectEditRoutePage = async ({ params }: { params: Params }) => {
    const { locale, id } = await params

    return renderProjectDetailRoute({ locale, id, scope: 'business', mode: 'edit' })
}

export default ProjectEditRoutePage
