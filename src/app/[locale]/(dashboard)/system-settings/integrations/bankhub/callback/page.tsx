import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import BankHubCallbackContent from '@/features/system-settings/integrations/components/BankHubCallbackContent'
import { getDictionary } from '@/shared/utils/getDictionary'

type BankHubCallbackPageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const MAX_PARAM_LENGTH = 200

const toCallbackParams = (searchParams: Record<string, string | string[] | undefined>) => (
  Object.entries(searchParams).map(([key, value]) => ({
    key,
    value: (Array.isArray(value) ? value.join(', ') : value ?? '').slice(0, MAX_PARAM_LENGTH)
  }))
)

const BankHubCallbackPage = async ({ params, searchParams }: BankHubCallbackPageProps) => {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const dictionary = await getDictionary(locale as Locale)

  return (
    <Box sx={{ p: 6 }}>
      <BankHubCallbackContent dictionary={dictionary} locale={locale} callbackParams={toCallbackParams(query)} />
    </Box>
  )
}

export default BankHubCallbackPage
