import { Locale } from '@/configs/i18n'
import { PageContentProps } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Session } from 'next-auth'

export type PageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export type FormValues = {
    ClientId: string
    DisplayName: string
    BICCode: string
    ExpiredOnUtc: string
    IsActive: boolean

    AccessTokenTtlSeconds: number
    AccessTokenTrustedIPs: string

    ClientSecret: string
    Description: string
    DeactivatedAt: string | null
    RateLimitPerMinute: number
    RefreshTokenLifeTimeInSeconds: number
}

export const DEFAULT_FORM_VALUES: FormValues = {
    ClientId: '',
    DisplayName: '',
    BICCode: '',
    ExpiredOnUtc: '',
    IsActive: true,

    AccessTokenTtlSeconds: 3600,
    AccessTokenTrustedIPs: '0.0.0.0, ::',

    ClientSecret: '',
    Description: '',
    DeactivatedAt: null,
    RateLimitPerMinute: 100,
    RefreshTokenLifeTimeInSeconds: 86400,
}
