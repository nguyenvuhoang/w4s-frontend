'use client'

import type { ReactElement } from 'react'

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import { Grid } from '@mui/material'

import { projectText, type ProjectDictionary } from '../projectListHelpers'
import ProjectBankAccountCard from './ProjectBankAccountCard'
import { PROJECT_BANK_ACCOUNT_GROUPS, type ProjectBankAccount, type ProjectBankAccountGroup } from './projectBankTypes'

const GROUP_ICONS: Record<ProjectBankAccountGroup, ReactElement> = {
  operating_bank_account: <AccountBalanceOutlinedIcon fontSize="small" />,
  deposit_bank_account: <SavingsOutlinedIcon fontSize="small" />
}

type Props = {
  dictionary: ProjectDictionary
  accounts: Partial<Record<ProjectBankAccountGroup, ProjectBankAccount | null>>
  /** Present = edit mode (Project Create). Absent = view mode (Business project / System Settings detail). */
  editing?: {
    disabled?: boolean
    onChange: (group: ProjectBankAccountGroup, field: keyof ProjectBankAccount, value: string) => void
  }
}

/**
 * Operating + Deposit account cards, side by side from lg and stacked on tablet / mobile. Single layout of the
 * project bank accounts, shared by the view tab and the Project Create form.
 */
const ProjectBankAccountGroups = ({ dictionary, accounts, editing }: Props) => (
  <Grid container spacing={2.5}>
    {PROJECT_BANK_ACCOUNT_GROUPS.map(({ group, titleKey, titleFallback }) => (
      <Grid key={group} size={{ xs: 12, lg: 6 }} data-bank-group={group}>
        <ProjectBankAccountCard
          dictionary={dictionary}
          title={projectText(dictionary, titleKey, titleFallback)}
          icon={GROUP_ICONS[group]}
          account={accounts[group] ?? null}
          editing={editing && { disabled: editing.disabled, onChange: (field, value) => editing.onChange(group, field, value) }}
        />
      </Grid>
    ))}
  </Grid>
)

export default ProjectBankAccountGroups
