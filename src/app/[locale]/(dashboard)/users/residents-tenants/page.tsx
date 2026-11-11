import { redirect } from 'next/navigation'

import { Locale } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = generateAuthMetadata('Residents/Tenants Management')

// This screen used to duplicate resident management: it only ever listed mobile-channel (MB)
// login accounts via the same BO user search used by Personnel (WF_BO_SIMPLE_SEARCH_USER), not
// actual resident profile data (name, apartment, identity, role...). Real resident/tenant
// management already lives at /resident/list (residentService, project-scoped), so this route
// now redirects there instead of keeping a second, confusing "resident" screen around.
const ResidentsTenantsPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params

    redirect(`/${locale}/resident/list`)
}

export default ResidentsTenantsPage
