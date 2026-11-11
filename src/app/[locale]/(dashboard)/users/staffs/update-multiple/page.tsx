import type { Locale } from '@/configs/i18n'
import { getStaffBulkImportHref } from '@/features/staffs/utils/staffRoutes'
import { redirect } from 'next/navigation'

// "Update Multiple Staff" was merged into the single "Add/Update Multiple Staff" screen at
// /create-multiple — server validation now determines Create vs Update per row via `action`.
// This route is kept only so old bookmarks/links keep working.
const StaffUpdateMultipleRedirectPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params

    redirect(getStaffBulkImportHref(locale))
}

export default StaffUpdateMultipleRedirectPage
