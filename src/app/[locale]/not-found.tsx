// Type Imports

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import NotFound from '@views/NotFound'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import FallbackSpinner from '@components/spinners'
import { Suspense } from 'react'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }));
}

const NotFoundPage = async () => {

  return (

    <Providers initialAvatar={null}>
      <Suspense fallback={<FallbackSpinner />}>
        <BlankLayout >
          <NotFound />
        </BlankLayout>
      </Suspense>
    </Providers >
  )
}

export default NotFoundPage
