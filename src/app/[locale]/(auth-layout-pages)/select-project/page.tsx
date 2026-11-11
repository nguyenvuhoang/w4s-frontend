import { generateAuthMetadata } from '@components/layout/AuthLayout'
import { i18n, type Locale } from '@/configs/i18n'
import { auth } from '@/auth'
import { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import SelectProjectScreen from './SelectProjectScreen'
import { toClientSessionToken } from '@utils/safeSessionToken'

export const metadata: Metadata = generateAuthMetadata('Select project')

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }))
}

const SelectProjectPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

    if (!session?.user?.token) {
        redirect(getLocalizedUrl('/login', locale))
    }

    return (
        <SelectProjectScreen
            dictionary={dictionary}
            locale={locale}
            sessiontoken={toClientSessionToken(session) ?? ''}
        />
    )
}

export default SelectProjectPage
