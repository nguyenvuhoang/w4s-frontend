import type { Metadata } from 'next'
import type { Locale } from '@/configs/i18n'
import { i18n } from '@/configs/i18n'
import ThemeProvider from '@components/theme'
import { SettingsProvider } from '@core/contexts/settingsContext'
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'
import { getBrandingSettings } from '@shared/services/brandingSettingsService'
import { getDictionary } from '@utils/getDictionary'
import Maintenance from '@views/Maintenance'

export const metadata: Metadata = {
    title: 'System Maintenance'
}

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }))
}

type Params = Promise<{ locale: Locale }>

const MaintenancePage = async ({ params }: { params: Params }) => {
    const { locale } = await params
    const [dictionary, settingsCookie, mode, systemMode, brandingSettings] = await Promise.all([
        getDictionary(locale),
        getSettingsFromCookie(),
        getMode(),
        getSystemMode(),
        getBrandingSettings()
    ])

    return (
        <SettingsProvider settingsCookie={settingsCookie} mode={mode} brandingSettings={brandingSettings}>
            <ThemeProvider systemMode={systemMode}>
                <Maintenance dictionary={dictionary.maintenance} locale={locale} />
            </ThemeProvider>
        </SettingsProvider>
    )
}

export default MaintenancePage
