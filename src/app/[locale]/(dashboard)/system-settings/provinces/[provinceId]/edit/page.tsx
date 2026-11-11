import { Box } from '@mui/material'
import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import ProvinceFormContent from '@/features/system-settings/provinces/components/ProvinceFormContent'
import { provinceService, toProvinceFormModel } from '@/features/system-settings/provinces/services/provinceService'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
export default async function EditProvincePage({ params, searchParams }: { params: Promise<{ locale: Locale; provinceId: string }>; searchParams: Promise<{ country_id?: string; province_code?: string }> }) { const [{ locale, provinceId }, query] = await Promise.all([params, searchParams]); const [dictionary, session] = await Promise.all([getDictionary(locale), auth()]); const item = await provinceService.getProvinceById({ sessiontoken: (await getServerBackendToken()) ?? undefined, language: locale, identity: { id: Number(provinceId), country_id: query.country_id ?? 'VN', province_code: query.province_code ?? '' } }).catch(() => null); return <Box sx={{ p: 6 }}>{item ? <ProvinceFormContent dictionary={dictionary} locale={locale} sessiontoken={session?.user?.token ?? undefined} initial={toProvinceFormModel(item)} id={item.id} /> : null}</Box> }
