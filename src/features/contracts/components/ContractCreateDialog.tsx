import type { ComponentProps } from 'react'

import ContractFormDialog from './ContractFormDialog'

type Props = Omit<ComponentProps<typeof ContractFormDialog>, 'mode' | 'contract'>

const ContractCreateDialog = (props: Props) => <ContractFormDialog {...props} mode="create" />

export default ContractCreateDialog
