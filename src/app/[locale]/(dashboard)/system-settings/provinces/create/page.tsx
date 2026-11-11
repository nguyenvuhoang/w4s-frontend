import { Box } from '@mui/material'
import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import ProvinceFormContent from '@/features/system-settings/provinces/components/ProvinceFormContent'
import { toProvinceFormModel } from '@/features/system-settings/provinces/services/provinceService'
import { getDictionary } from '@/shared/utils/getDictionary'
export default async function CreateProvincePage({ params }: { params: Promise<{ locale: Locale }> }) { const { locale } = await params; const [dictionary, session] = await Promise.all([getDictionary(locale), auth()]); return <Box sx={{ p: 6 }}><ProvinceFormContent dictionary={dictionary} locale={locale} sessiontoken={session?.user?.token ?? undefined} initial={toProvinceFormModel({ country_id: 'VN' })} /></Box> }
