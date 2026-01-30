// app/[locale]/(auth)/AuthPayload.tsx
import { getDictionary } from '@utils/getDictionary'
import { getServerMode } from '@utils/serverHelpers'
import type { Locale } from '@/configs/i18n'
import type { Mode } from '@core/types'

type Props = {
    locale: Locale
    children: (p: { mode: Mode; dictionary: any; locale: Locale }) => React.ReactElement
}

export default async function AuthPayload({ locale, children }: Props) {
    const mode = await getServerMode()
    const dictionary = await getDictionary(locale)

    return children({ mode, dictionary, locale })
}

