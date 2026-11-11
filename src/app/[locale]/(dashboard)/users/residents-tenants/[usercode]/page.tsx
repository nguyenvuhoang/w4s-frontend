import { redirect } from 'next/navigation'

import { Locale } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = generateAuthMetadata('Resident/Tenant Detail')

// See src/app/[locale]/(dashboard)/users/residents-tenants/page.tsx — this detail screen showed
// the same BO user account detail as Personnel, not a resident profile, so it is consolidated
// into /resident/list too. There is no usercode -> resident id mapping available here, so this
// sends the admin back to the real resident list rather than a broken/duplicate detail page.
const ResidentTenantDetailPage = async (props: { params: Promise<{ locale: Locale; usercode: string }> }) => {
    const { locale } = await props.params

    redirect(`/${locale}/resident/list`)
}

export default ResidentTenantDetailPage
