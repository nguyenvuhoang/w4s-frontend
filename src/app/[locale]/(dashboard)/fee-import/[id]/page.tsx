import { auth } from '@/auth'
import { type Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeImportDetailPage from '@/features/fees/fee-import/FeeImportDetailPage'
import { feeImportWorkflowService } from '@/features/fees/fee-import/feeImportWorkflow.service'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getServerWorkingProjectScope } from '@/shared/services/workingProjectScope.server'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

export default async function FeeImportDetailRoute({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id: rawId } = await params; const id = Number(rawId); const [dictionary, session, token, scope] = await Promise.all([getDictionary(locale), auth(), getServerBackendToken(), getServerWorkingProjectScope()]); const initial = Number.isInteger(id) && id > 0 && token && scope ? await feeImportWorkflowService.get({ sessiontoken: token, language: locale, scope, id }).catch(() => null) : null
  return <AuthorizedLayout requiredPath='/fee-import' params={{ locale }}>{() => <FeeImportDetailPage dictionary={dictionary} locale={locale} sessiontoken={toClientSessionToken(session) ?? undefined} id={id} initial={initial} initialScope={scope} />}</AuthorizedLayout>
}
