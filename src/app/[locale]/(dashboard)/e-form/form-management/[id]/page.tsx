import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@/shared/utils/getDictionary'

import FormTemplateDetailPage from '@/features/formtemplates/FormTemplateDetailPage'
import { formTemplateService } from '@/features/formtemplates/formTemplateService'
import type { FormTemplateDetailModel } from '@/features/formtemplates/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
  locale: Locale
  id: string
}>

const FormTemplateDetailRoutePage = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const sessiontoken = (await getServerBackendToken()) ?? undefined
  const formTemplateId = Number(id)

  let initialFormTemplate: FormTemplateDetailModel | null = null
  let initialError: string | null = null

  if (!Number.isInteger(formTemplateId) || formTemplateId <= 0) {
    initialError = dictionary.formTemplateManagement?.formTemplateNotFound ?? 'Form template not found.'
  } else {
    try {
      initialFormTemplate = await formTemplateService.getFormTemplateById({
        sessiontoken,
        language: locale,
        id: formTemplateId
      })

      if (!initialFormTemplate) {
        initialError = dictionary.formTemplateManagement?.formTemplateNotFound ?? 'Form template not found.'
      }
    } catch (err) {
      initialError = err instanceof Error ? err.message : (dictionary.formTemplateManagement?.formTemplateLoadError ?? 'Unable to load form template detail.')
    }
  }

  return (
    <AuthorizedLayout requiredPath="/e-form/form-management" params={{ locale }}>
      {() => (
        <FormTemplateDetailPage
          dictionary={dictionary}
          locale={locale}
          formTemplateId={formTemplateId}
          initialFormTemplate={initialFormTemplate}
          initialError={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FormTemplateDetailRoutePage
