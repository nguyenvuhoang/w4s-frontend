import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ResidentFeedbackDetailPage from '@/features/resident-feedback/ResidentFeedbackDetailPage'
import { residentFeedbackService } from '@/features/resident-feedback/services/residentFeedbackService'
import { ResidentFeedbackWorkflowError, type ResidentFeedbackDetail } from '@/features/resident-feedback/types'
import { getDictionary } from '@utils/getDictionary'

import type { SearchParams } from '../../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
  locale: Locale
  request_code: string
}>

const buildBackHref = (locale: Locale, searchParams: SearchParams) => {
  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined) params.append(key, item)
      })

      return
    }

    if (value !== undefined) params.set(key, value)
  })

  const query = params.toString()

  return `/${locale}/feedback/resident-feedback${query ? `?${query}` : ''}`
}

const ResidentFeedbackDetailRoutePage = async ({
  params,
  searchParams
}: {
  params: Params
  searchParams?: Promise<SearchParams>
}) => {
  const { locale, request_code } = await params
  const search_params = await searchParams ?? {}
  const requestCode = decodeURIComponent(request_code)
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const sessiontoken = (await getServerBackendToken()) ?? undefined
  const backHref = buildBackHref(locale, search_params)

  let request: ResidentFeedbackDetail | null = null
  let error: { message: string; executionId?: string } | null = null

  if (!requestCode) {
    error = { message: dictionary.resident_feedback?.detail_missing_request_code ?? 'Request code is required.' }
  } else {
    try {
      request = await residentFeedbackService.getResidentFeedbackDetail({
        sessiontoken,
        language: locale,
        request_code: requestCode
      })
    } catch (caught) {
      if (caught instanceof ResidentFeedbackWorkflowError && caught.next_action === 'logout') {
        redirect(`/${locale}/logout`)
      }

      error = {
        message: caught instanceof Error
          ? caught.message
          : dictionary.resident_feedback?.detail_load_failed ?? 'Unable to load resident feedback detail.',
        executionId: caught instanceof ResidentFeedbackWorkflowError ? caught.execution_id : undefined
      }
    }
  }

  return (
    <AuthorizedLayout requiredPath="/feedback/resident-feedback" params={{ locale }}>
      {() => (
        <ResidentFeedbackDetailPage
          dictionary={dictionary}
          locale={locale}
          request={request}
          error={error}
          backHref={backHref}
          requestCode={requestCode}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ResidentFeedbackDetailRoutePage
