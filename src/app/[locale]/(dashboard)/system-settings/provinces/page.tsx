import { Box } from '@mui/material'
import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import ProvinceListContent from '@/features/system-settings/provinces/components/ProvinceListContent'
import { emptyProvinceFilter, provinceService } from '@/features/system-settings/provinces/services/provinceService'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
export default async function ProvincesPage({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; const [dictionary, session] = await Promise.all([getDictionary(locale), auth()]); const initialData = await provinceService.searchProvinces({ sessiontoken: (await getServerBackendToken()) ?? undefined, language: locale, filter: emptyProvinceFilter }).catch(() => ({ items: [], total_count: 0, total_pages: 0, page_index: 0, page_size: 20, has_previous_page: false, has_next_page: false })); return <Box sx={{ p: 6 }}><ProvinceListContent dictionary={dictionary} session={session} locale={locale} initialFilter={emptyProvinceFilter} initialData={initialData} /></Box> }
