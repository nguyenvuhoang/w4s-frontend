// app/[locale]/(auth)/layout.tsx
import type { Locale } from '@/configs/i18n'
import { siteConfig } from '@/data/meta'
import { Metadata } from 'next'
import { Suspense } from 'react'
import AuthPayload from './AuthPayload'

interface AuthLayoutProps {
    children: (props: { dictionary: any; locale: Locale }) => React.ReactElement
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
