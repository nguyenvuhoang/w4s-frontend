import type { ComponentProps } from 'react'

import ContractFormDialog from './ContractFormDialog'

type Props = Omit<ComponentProps<typeof ContractFormDialog>, 'mode'>

const ContractEditDialog = (props: Props) => <ContractFormDialog {...props} mode="edit" />

export default ContractEditDialog
