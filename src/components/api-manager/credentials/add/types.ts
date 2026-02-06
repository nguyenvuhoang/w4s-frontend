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
    Environment: 'DEV' | 'UAT' | 'PROD'
    Scopes: string[]
    BICCode: string
    ExpiredOnUtc: string
    IsActive: boolean

    AccessTokenTtlSeconds: number
    AccessTokenMaxTtlSeconds: number
    AccessTokenMaxUses: number | '' | null
    AccessTokenTrustedIPs: string
    ClientSecretTrustedIPs: string

    ClientSecretDescription: string
    ClientSecretExpiresOnUtc: string
}

export const ENV_OPTS: Array<'DEV' | 'UAT' | 'PROD'> = ['DEV', 'UAT', 'PROD']

export const DEFAULT_FORM_VALUES: FormValues = {
    ClientId: '',
    DisplayName: '',
    Environment: 'DEV',
    Scopes: [],
    BICCode: '',
    ExpiredOnUtc: '',
    IsActive: true,

    AccessTokenTtlSeconds: 2_592_000,
    AccessTokenMaxTtlSeconds: 2_592_000,
    AccessTokenMaxUses: '',
    AccessTokenTrustedIPs: '0.0.0.0, ::',
    ClientSecretTrustedIPs: '0.0.0.0, ::',

    ClientSecretDescription: '',
    ClientSecretExpiresOnUtc: ''
}
