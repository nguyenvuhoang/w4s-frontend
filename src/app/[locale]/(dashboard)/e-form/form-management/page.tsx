import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FormTemplateManagementPage from '@/features/formtemplates/FormTemplateManagementPage'
import { formTemplateService } from '@/features/formtemplates/formTemplateService'
import { emptyFormTemplateFilter } from '@/features/formtemplates/formTemplateHelpers'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const FormTemplatesPage = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  const initialFilter = emptyFormTemplateFilter
  const initialData = formTemplateService.getDefaultFormTemplateResponse(initialFilter)

  return (
    <AuthorizedLayout requiredPath="/e-form/form-management" params={{ locale }}>
      {() => (
        <FormTemplateManagementPage
          dictionary={dictionary}
          session={session}
          locale={locale}
          initialFilter={initialFilter}
          initialData={initialData}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FormTemplatesPage
