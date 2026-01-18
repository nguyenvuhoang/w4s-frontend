import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { menuService } from '@/servers/system-service'
import { MenuItem, PageData } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import MenuManagementContent from '@/views/nolayout/menu-management'
import MenuManagementError from '@/views/nolayout/menu-management/MenuManagementError'
import MenuManagementSkeleton from '@/views/nolayout/menu-management/MenuManagementSkeleton'
import DescriptionIcon from '@mui/icons-material/Description'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

async function MenuManagementData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)
    const response = await menuService.loadMenu({
        sessiontoken: session?.user?.token as string,
        pageindex: 0,
        pagesize: 10,
        searchtext: '',
        language: locale,
    });

    if (
        !isValidResponse(response) ||
        (response.payload.dataresponse.errors && response.payload.dataresponse.errors.length > 0)
    ) {
        const execute_id = response.payload.dataresponse.errors[0]?.execute_id
        const errorinfo = response.payload.dataresponse.errors[0]?.info
        
        return <MenuManagementError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }
    const data = response.payload.dataresponse.data as unknown as PageData<MenuItem> 

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
