'use client'

import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { Alert, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'

import { useWorkflowDesigner } from '../hooks/useWorkflowDesigner'
import type { WorkflowsDictionary } from '../types'
import { commonText, workflowText } from './workflowHelpers'
import WorkflowGraphDesigner from './WorkflowGraphDesigner'

type Props = { dictionary: WorkflowsDictionary; locale: Locale; workflowId: string }

const WorkflowDesignerContent = ({ dictionary, locale, workflowId }: Props) => {
  const router = useRouter()
  const { definition, steps, loading, error } = useWorkflowDesigner(locale, workflowId)
  const errorText = error?.executionId ? `${error.message} ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${error.executionId}` : error?.message

  return (
    <Stack spacing={3}>
      <Button onClick={() => router.push(`/${locale}/system-settings/workflows/${encodeURIComponent(workflowId)}`)} startIcon={<ArrowBackRounded />} sx={{ alignSelf: 'flex-start' }}>{workflowText(dictionary, 'designer_back_to_detail', 'Back to workflow details')}</Button>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><AccountTreeRounded color="primary" fontSize="large" /><Typography variant="h5" fontWeight={800}>{workflowText(dictionary, 'designer_title', 'Workflow designer')}</Typography></Stack>
        <Typography variant="body1" fontWeight={700}>{definition?.workflow_name || workflowId}</Typography>
        <Typography variant="body2" color="text.secondary">{workflowId}</Typography>
      </Paper>
      {loading && <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}><CircularProgress /><Typography color="text.secondary">{workflowText(dictionary, 'designer_loading', 'Loading workflow designer...')}</Typography></Stack>}
      {!loading && errorText && <Alert severity="error">{errorText}</Alert>}
      {!loading && !error && <WorkflowGraphDesigner dictionary={dictionary} workflowId={workflowId} steps={steps} />}
    </Stack>
  )
}

export default WorkflowDesignerContent
