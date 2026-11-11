import { auth } from '@/auth'
import { type Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeImportFormPage from '@/features/fees/fee-import/FeeImportFormPage'
import { feeImportWorkflowService } from '@/features/fees/fee-import/feeImportWorkflow.service'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getServerWorkingProjectScope } from '@/shared/services/workingProjectScope.server'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

export default async function EditFeeImportPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id: rawId } = await params; const id = Number(rawId); const [dictionary, session, token, scope] = await Promise.all([getDictionary(locale), auth(), getServerBackendToken(), getServerWorkingProjectScope()]); const item = Number.isInteger(id) && id > 0 && token && scope ? await feeImportWorkflowService.get({ sessiontoken: token, language: locale, scope, id }).catch(() => null) : null
  return <AuthorizedLayout requiredPath='/fee-import' requiredAction='MODIFY' params={{ locale }}>{() => <FeeImportFormPage dictionary={dictionary} locale={locale} sessiontoken={toClientSessionToken(session) ?? undefined} item={item} />}</AuthorizedLayout>
}
