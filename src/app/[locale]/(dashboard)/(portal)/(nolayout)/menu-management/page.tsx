import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import MenuManagementContent from '@/views/nolayout/menu-management'
import MenuManagementSkeleton from '@/views/nolayout/menu-management/MenuManagementSkeleton'
import { Suspense } from 'react'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import DescriptionIcon from '@mui/icons-material/Description'
import { MenuItem } from '@/types/systemTypes'
import { systemServiceApi } from '@/servers/system-service'
import { WORKFLOWCODE } from '@/data/WorkflowCode'

type Params = Promise<{
    locale: Locale
}>

async function MenuManagementData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)
    const fetchMenuData = async (): Promise<MenuItem[]> => {
        try {
            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.SYS_GET_MENU,
                input: {},
                language: locale,
                use_microservice: false
            });

            if (response.status === 200 && response.payload?.dataresponse?.fo) {
                return response.payload.dataresponse.fo[0].input.data as MenuItem[];
            }
        } catch (error) {
            console.error("Error fetching menu data:", error);
        }
        return [];
    };
    const data = await fetchMenuData();
    return <MenuManagementContent data={data} dictionary={dictionary} session={session} locale={locale} />
}

const MenuManagementPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper
            icon={<DescriptionIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            title={`${dictionary['menumanagement']?.title || 'MenuManagement'}`}
            description={dictionary['menumanagement']?.description || 'MenuManagement page'}
            dictionary={dictionary}
        >
            <Suspense fallback={<MenuManagementSkeleton dictionary={dictionary} />}>
                <MenuManagementData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default MenuManagementPage
