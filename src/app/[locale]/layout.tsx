import ClientCss from "@components/theme/clientcss";
import { cn } from "@utils";
import type { Locale } from '@configs/i18n';
import type { ChildrenType } from '@core/types';

export const metadata = {
  title: 'EMI Portal',
  description: 'EMI Portal'
}

type Params = Promise<{
  locale: Locale
}>

const RootLayout = async ({ children, params }: ChildrenType & { params: Params }) => {
  const { locale } = await params

  return (
    <html id='__next' lang={locale}>
      <head>
        <meta name="supported-color-schemes" content="light" />
        <meta name="color-scheme" content="light only" />
        <meta name="darkreader-lock" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>

      <body className={cn('flex is-full min-bs-full flex-auto flex-col')} style={{ fontFamily: 'Quicksand, sans-serif' }} suppressHydrationWarning>
        <ClientCss />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
