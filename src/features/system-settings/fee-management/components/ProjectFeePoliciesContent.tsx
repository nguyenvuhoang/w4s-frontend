'use client'

import {
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'

import type { FeeProjectOption } from '@/features/fees/types'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { feeSettingsText } from '../feeSettingsModules'
import BackendPendingNotice from './BackendPendingNotice'
import FeeSettingsPageHeader from './FeeSettingsPageHeader'

type DebtMode = 'ACCUMULATE' | 'PER_PERIOD'

type ProjectFeePolicyDraft = {
  debt_mode: DebtMode
  auto_carry_over: boolean
}

type ProjectFeePoliciesContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  projects: FeeProjectOption[]
  initialError?: WorkflowErrorDetail | null
}

const DEBT_MODES: DebtMode[] = ['ACCUMULATE', 'PER_PERIOD']

const defaultPolicy = (): ProjectFeePolicyDraft => ({ debt_mode: 'ACCUMULATE', auto_carry_over: true })

/**
 * Per-project fee policy. Projects come from the existing project search workflow; reading/saving the
 * policy itself needs backend workflows that do not exist yet, so the form is prepared but not saved.
 */
const ProjectFeePoliciesContent = ({ dictionary, locale, projects, initialError = null }: ProjectFeePoliciesContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const [project, setProject] = useState<FeeProjectOption | null>(null)
  const [policy, setPolicy] = useState<ProjectFeePolicyDraft>(defaultPolicy)

  const modeTexts: Record<DebtMode, { title: string; description: string }> = {
    ACCUMULATE: {
      title: text('debt_mode_accumulate', 'Accumulate debt'),
      description: text('debt_mode_accumulate_description', 'Unpaid amounts of previous periods are carried into the next notice; the resident pays one running balance.')
    },
    PER_PERIOD: {
      title: text('debt_mode_per_period', 'Manage each period separately'),
      description: text('debt_mode_per_period_description', 'Each period keeps its own debt; payments are matched to the specific period.')
    }
  }

  return (
    <Stack spacing={4}>
      <FeeSettingsPageHeader dictionary={dictionary} locale={locale} moduleKey='project-policies' />

      <BackendPendingNotice
        title={text('backend_pending_title', 'Awaiting backend workflow')}
        description={text(
          'policy_backend_pending_description',
          'Projects are loaded from the system. Reading and saving the project fee policy will be enabled once the backend provides the policy workflows.'
        )}
      />

      {initialError && (
        <WorkflowErrorAlert
          title={text('projects_load_failed', 'Unable to load projects.')}
          message={initialError.message}
          workflowId={initialError.workflowId}
          errorCode={initialError.errorCode}
          executionId={initialError.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
        />
      )}

      <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Autocomplete
            options={projects}
            value={project}
            onChange={(_event, value) => {
              setProject(value)
              setPolicy(defaultPolicy())
            }}
            getOptionLabel={option => (option.code ? `${option.code} - ${option.name}` : option.name)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={text('project_empty', 'No projects found.')}
            sx={{ maxWidth: 520 }}
            renderInput={params => (
              <TextField {...params} size='small' required label={text('field_project', 'Project')} placeholder={text('project_placeholder', 'Select a project to configure')} />
            )}
          />

          {!project ? (
            <Typography variant='body2' color='text.secondary'>
              {text('policy_select_project_hint', 'Select a project to configure its fee policy.')}
            </Typography>
          ) : (
            <>
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1.5 }}>
                  {text('debt_mode_title', 'Debt management method')}
                </Typography>
                <RadioGroup
                  value={policy.debt_mode}
                  onChange={event => {
                    const debtMode = event.target.value as DebtMode

                    setPolicy({ debt_mode: debtMode, auto_carry_over: debtMode === 'ACCUMULATE' && policy.auto_carry_over })
                  }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
                    {DEBT_MODES.map(mode => {
                      const selected = policy.debt_mode === mode

                      return (
                        <Paper
                          key={mode}
                          variant='outlined'
                          sx={theme => ({
                            flex: 1,
                            p: 2,
                            borderRadius: 2,
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
                          })}
                        >
                          <FormControlLabel
                            value={mode}
                            control={<Radio />}
                            sx={{ alignItems: 'flex-start', m: 0 }}
                            label={(
                              <Box sx={{ pt: 1 }}>
                                <Typography sx={{ fontWeight: 700 }}>{modeTexts[mode].title}</Typography>
                                <Typography variant='body2' color='text.secondary'>{modeTexts[mode].description}</Typography>
                              </Box>
                            )}
                          />
                        </Paper>
                      )
                    })}
                  </Stack>
                </RadioGroup>
              </Box>

              <FormControlLabel
                control={(
                  <Switch
                    checked={policy.auto_carry_over}
                    disabled={policy.debt_mode !== 'ACCUMULATE'}
                    onChange={event => setPolicy(current => ({ ...current, auto_carry_over: event.target.checked }))}
                  />
                )}
                label={(
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{text('auto_carry_over', 'Automatically carry debt over when a new period is issued')}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {text('auto_carry_over_description', 'Only applies to the accumulate method. Outstanding debt of the previous period is moved into the newly issued period.')}
                    </Typography>
                  </Box>
                )}
                sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
              />

              <Stack direction='row' justifyContent='flex-end' gap={1}>
                <Button variant='outlined' onClick={() => setPolicy(defaultPolicy())}>{text('reset', 'Reset')}</Button>
                <Button variant='contained' disabled>{text('save', 'Save')}</Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}

export default ProjectFeePoliciesContent
