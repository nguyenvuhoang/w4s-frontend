'use client'

import { Alert, Chip, Paper, Stack, Typography } from '@mui/material'

import { projectText, type ProjectDictionary } from '../projectListHelpers'
import ProjectBankAccountGroups from './ProjectBankAccountGroups'
import { hasProjectBankAccountValue, PROJECT_BANK_ACCOUNT_GROUPS, type ProjectBankAccounts } from './projectBankTypes'

/**
 * view   = Business Project (/properties/project): read-only, for the working project.
 * manage = System Settings > Project Management (/system-settings/projects/:id): future configuration by the
 *          Super Admin. Renders like `view`: WF_BO_UPDATE_PROJECT does not confirm the bank objects yet, so
 *          there is no edit / save action.
 */
export type ProjectBankInformationMode = 'view' | 'manage'

type Props = {
  dictionary: ProjectDictionary
  /** Project the accounts belong to, given by the caller (working project, or the project of the detail route). */
  project: { id: number; name: string; code: string }
  /**
   * Accounts of that project as read from WF_BO_GET_PROJECT_DETAIL (null / missing = not returned). Never
   * filled from Create data kept on the client.
   */
  accounts: Partial<ProjectBankAccounts>
  mode?: ProjectBankInformationMode
}

/**
 * "Thông tin ngân hàng" of a project, shared by the Business project screen and the System Settings project
 * detail: operating and deposit receiving accounts side by side on desktop (stacked below lg), view only.
 */
const ProjectBankInformationTab = ({ dictionary, project, accounts, mode = 'view' }: Props) => {
  const hasAccounts = PROJECT_BANK_ACCOUNT_GROUPS.some(({ group }) => hasProjectBankAccountValue(accounts[group]))

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }} data-bank-mode={mode}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{projectText(dictionary, 'bankInformation', 'Bank information')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {projectText(dictionary, 'bankInformationSubtitle', 'Manage receiving accounts and payment instructions for this project.')}
            </Typography>
          </Stack>
          {/* Project identity only (not the whole project card): the accounts belong to this project. */}
          <Stack spacing={0.25} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ minWidth: 0 }} data-bank-project={project.id}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{project.name}</Typography>
            <Chip size="small" label={project.code} sx={{ fontWeight: 700 }} />
          </Stack>
        </Stack>

        {!hasAccounts && <Alert severity="info">{projectText(dictionary, 'bankAccountsEmpty', 'Bank account information is not available yet.')}</Alert>}

        <ProjectBankAccountGroups dictionary={dictionary} accounts={accounts} />
      </Stack>
    </Paper>
  )
}

export default ProjectBankInformationTab
