import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import ContractDetailPage from '@/features/contracts/ContractDetailPage'
import { contractsText } from '@/features/contracts/components/contractHelpers'
import { contractService } from '@/features/contracts/services/contractService'
import type { ContractItem } from '@/features/contracts/types'
import { ContractWorkflowError } from '@/features/contracts/types'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const ContractDetailRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const contractId = Number(id)
  const resolvedContractId = Number.isInteger(contractId) && contractId > 0 ? contractId : 0
  let contract: ContractItem | null = null
  let initialError: { message: string; executionId?: string } | null = null

  if (!resolvedContractId) {
    initialError = {
      message: contractsText(dictionary, 'contract_detail_not_found', 'Contract detail was not found.')
    }
  } else {
    try {
      contract = await contractService.getContractById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        id: resolvedContractId
      })
    } catch (error) {
      initialError = {
        message: error instanceof Error
          ? error.message
          : contractsText(dictionary, 'detail_load_failed', 'Unable to load contract detail.'),
        executionId: error instanceof ContractWorkflowError ? error.execution_id : undefined
      }
      logger.error('[contracts] Unable to load detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/contracts/contracts" params={{ locale }}>
      {() => (
        <ContractDetailPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          contract={contract}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ContractDetailRoute
