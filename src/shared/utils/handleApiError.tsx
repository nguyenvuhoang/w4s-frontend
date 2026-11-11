import { redirect } from 'next/navigation'
import { getLocalizedUrl } from '@utils/i18n'
import { isTokenError } from './isTokenError'
import { isNoSystemAccessError } from './systemAccessError'
import type { Locale } from '@/configs/i18n'
import type { ErrorInfo } from '@/shared/types'
import type { getDictionary } from './getDictionary'
import ErrorPage from '@/views/Error'
import NoSystemAccessPage from '@/views/NoSystemAccessPage'
import PageError from '@components/PageError'

type ApiErrorHandlerOptions = {
    locale: Locale
    error?: ErrorInfo | null
    /** If true, renders PageError component (for client components), otherwise redirects */
    usePageError?: boolean
    /** Only used for the isNoSystemAccessError branch below (its copy is localized) — every other
     * branch is unchanged and doesn't need it. Optional because most callers already have a
     * dictionary in scope anyway; NoSystemAccessPage falls back to hardcoded Vietnamese copy if
     * omitted, same pattern as ErrorPage's/ForbiddenPage's own defaults. */
    dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

/**
 * Handle API errors consistently across the application
 * - If token error: redirects to logout
 * - Otherwise: returns error component or redirects based on context
 */
export function handleApiError({ locale, error, usePageError = false, dictionary }: ApiErrorHandlerOptions) {
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

    // Session is valid, but the user has no role/channel assignment into BO at all — a distinct
    // case from a technical/token error, and from SelectProjectScreen's "no project assigned"
    // (that one requires the user to already be a valid BO user). Never falls through to the
    // generic ErrorPage/PageError below.
    if (isNoSystemAccessError(error)) {
        return <NoSystemAccessPage locale={locale} dictionary={dictionary} />
    }

    // Otherwise, show error page
    const errorMessage = `ExecutionID:${error.execute_id} - ${error.info}`
    
    if (usePageError) {
        return <PageError errorDetails={errorMessage} />
    }
    
    return <ErrorPage error={errorMessage} side="server" />
}
