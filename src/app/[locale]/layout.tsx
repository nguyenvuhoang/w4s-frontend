import ClientCss from "@components/theme/clientcss";
import PerformanceMeasureGuard from "@components/PerformanceMeasureGuard";
import InspectGuard from "@components/InspectGuard";
import { cn } from "@utils";
import type { Locale } from '@configs/i18n';
import type { ChildrenType } from '@core/types';

import { getSettingsFromCookie } from "@core/utils/serverHelpers";
import { getBrandingSettings } from "@shared/services/brandingSettingsService";

export const metadata = {
  title: 'Admin Console',
  description: 'Admin Console'
}

type Params = Promise<{
  locale: Locale
}>

const RootLayout = async ({ children, params }: ChildrenType & { params: Params }) => {
  const { locale } = await params
  const settings = await getSettingsFromCookie()
  const brandingSettings = await getBrandingSettings()
  const fontFamily = settings.fontFamily || brandingSettings.fontFamily

  return (
    <html id='__next' lang={locale} suppressHydrationWarning>
      <head>
        <meta name="supported-color-schemes" content="light" />
        <meta name="color-scheme" content="light only" />
        <meta name="darkreader-lock" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>

      <body
        className={cn('flex is-full min-bs-full flex-auto flex-col')}
        style={{ '--app-font-family': fontFamily, fontFamily: fontFamily } as any}
        suppressHydrationWarning
      >
        <ClientCss />
        <PerformanceMeasureGuard />
        <InspectGuard />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
