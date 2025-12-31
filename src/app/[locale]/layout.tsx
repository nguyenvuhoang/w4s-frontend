import ClientCss from "@/components/theme/clientcss";
import { cn } from "@/utils";
import type { Locale } from '@configs/i18n';
import type { ChildrenType } from '@core/types';
import localFont from "next/font/local";


const quicksand = localFont({
  src: "./../fonts/Quicksand-Regular.woff",
  variable: "--font-quicksand-sans",
});

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
      </head>

      <body className={cn('flex is-full min-bs-full flex-auto flex-col', quicksand.variable)} suppressHydrationWarning>
        <ClientCss />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
