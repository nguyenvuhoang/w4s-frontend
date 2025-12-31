// app/[locale]/(auth)/layout.tsx
import { Suspense } from 'react'
import AuthPayload from './AuthPayload'
import type { Locale } from '@/configs/i18n'
import type { Mode } from '@core/types'
import { Metadata } from 'next'
import { siteConfig } from '@/data/meta';

interface AuthLayoutProps {
    children: (props: { mode: Mode; dictionary: any; locale: Locale }) => React.ReactElement
    params: { locale: Locale }
}

export const generateAuthMetadata = (pageName: string): Metadata => ({
    title: `${siteConfig.shortName} - ${pageName}`,
    description: `${siteConfig.description}`,
});

export default function AuthLayout({ children, params }: AuthLayoutProps) {
    return (
        <Suspense fallback={null}>
            <AuthPayload locale={params.locale}>
                {children}
            </AuthPayload>
        </Suspense>
    )
}
