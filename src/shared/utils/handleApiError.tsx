import { redirect } from 'next/navigation'
import { getLocalizedUrl } from '@utils/i18n'
import { isTokenError } from './isTokenError'
import type { Locale } from '@/configs/i18n'
import type { ErrorInfo } from '@/shared/types'
import ErrorPage from '@/views/Error'
import PageError from '@components/PageError'

type ApiErrorHandlerOptions = {
    locale: Locale
    error?: ErrorInfo | null
    /** If true, renders PageError component (for client components), otherwise redirects */
    usePageError?: boolean
}

/**
 * Handle API errors consistently across the application
 * - If token error: redirects to logout
 * - Otherwise: returns error component or redirects based on context
 */
export function handleApiError({ locale, error, usePageError = false }: ApiErrorHandlerOptions) {
    if (!error) {
        if (usePageError) {
            return <PageError errorDetails="Unknown server error" />
        }
        return <ErrorPage error="Unknown server error" side="server" />
    }

    // Check if it's a token error and redirect to logout
    if (isTokenError(error)) {
        redirect(getLocalizedUrl('/logout', locale))
    }

    // Otherwise, show error page
    const errorMessage = `ExecutionID:${error.execute_id} - ${error.info}`
    
    if (usePageError) {
        return <PageError errorDetails={errorMessage} />
    }
    
    return <ErrorPage error={errorMessage} side="server" />
}
