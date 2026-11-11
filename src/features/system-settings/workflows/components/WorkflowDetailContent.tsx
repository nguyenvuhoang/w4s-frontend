'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import JsonEditorComponent from '@/@core/components/jSONEditor'
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import AssignmentRounded from '@mui/icons-material/AssignmentRounded'
import CodeRounded from '@mui/icons-material/CodeRounded'
import DataObjectRounded from '@mui/icons-material/DataObjectRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import SettingsSuggestRounded from '@mui/icons-material/SettingsSuggestRounded'
import SendRounded from '@mui/icons-material/SendRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'

import { workflowService } from '../services/workflowService'
import type { WorkflowDefinition, WorkflowStepItem, WorkflowsDictionary } from '../types'
import { WorkflowApiError } from '../types'
import { getWorkflowDesignerRoute } from '../workflowRoutes'
import { commonText, getWorkflowStatusMeta, workflowText } from './workflowHelpers'

type Props = { dictionary: WorkflowsDictionary; locale: Locale; workflowId: string }
type JsonErrors = Record<string, string>

const emptyDefinition = (workflowId: string): WorkflowDefinition => ({
  workflow_id: workflowId, workflow_name: '', description: '', channel_id: '', status: null,
  timeout: null, is_reverse: null, template_response: '', workflow_event: ''
})

const isJson = (value: string) => {
  try {
    JSON.parse(value || '{}')
    return true
  } catch {
    return false
  }
}

const JsonEditorField = ({
  label, value, disabled, error, dictionary, onChange
}: {
  label: string; value: string; disabled: boolean; error?: string; dictionary: WorkflowsDictionary; onChange: (value: string, error?: string) => void
}) => (
  <Stack spacing={0.75} sx={{ minWidth: 0 }}>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
    <Box sx={{ border: 1, borderColor: error ? 'error.main' : 'divider', borderRadius: 1, overflow: 'hidden', '& .jsoneditor': { border: 'none' } }}>
      <JsonEditorComponent
        initialText={value || '{}'}
        onChange={json => onChange(JSON.stringify(json, null, 2))}
        onChangeText={text => onChange(text, isJson(text) ? undefined : workflowText(dictionary, 'json_invalid', 'Invalid JSON.'))}
        height="220px"
        readOnly={disabled}
        mode="code"
        modes={['tree', 'form', 'code', 'text']}
      />
    </Box>
    {error && <Typography variant="caption" color="error.main">{error}</Typography>}
  </Stack>
)

const StatusField = ({ value, disabled, label, dictionary, onChange }: {
  value: string | null; disabled: boolean; label: string; dictionary: WorkflowsDictionary; onChange: (value: string | null) => void
}) => {
  const statusMeta = getWorkflowStatusMeta(value, dictionary)
  const statuses = ['A', 'I', 'B', 'DRAFT']

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value ?? ''}
        onChange={event => onChange(event.target.value || null)}
        renderValue={() => <Chip size="small" color={statusMeta.color} variant={statusMeta.variant} label={statusMeta.label} />}
      >
        {statuses.map(status => {
          const itemMeta = getWorkflowStatusMeta(status, dictionary)

          return <MenuItem key={status} value={status}><Chip size="small" color={itemMeta.color} variant={itemMeta.variant} label={itemMeta.label} /></MenuItem>
        })}
      </Select>
    </FormControl>
  )
}

const SectionTitle = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
    <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>{icon}</Box>
    <Typography variant="h6" sx={{ fontWeight: 800 }}>{children}</Typography>
  </Stack>
)

const WorkflowDetailContent = ({ dictionary, locale, workflowId }: Props) => {
  const router = useRouter()
  const [definition, setDefinition] = useState<WorkflowDefinition>(() => emptyDefinition(workflowId))
  const [steps, setSteps] = useState<WorkflowStepItem[]>([])
  const [snapshot, setSnapshot] = useState<{ definition: WorkflowDefinition; steps: WorkflowStepItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [jsonErrors, setJsonErrors] = useState<JsonErrors>({})
  const [error, setError] = useState<{ message: string; executionId?: string } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [searchResult, stepResult] = await Promise.all([
          workflowService.searchWorkflows({ language: locale, filter: { search_text: workflowId, channel_id: '', page_index: 0, page_size: 100 } }),
          workflowService.getWorkflowSteps({ language: locale, workflowId })
        ])
        if (!active) return
        setDefinition(searchResult.items.find(item => item.def.workflow_id === workflowId)?.def ?? emptyDefinition(workflowId))
        setSteps(stepResult)
      } catch (caught) {
        if (!active) return
        setError({
          message: caught instanceof Error ? caught.message : workflowText(dictionary, 'detail_load_failed', 'Unable to load workflow details.'),
          executionId: caught instanceof WorkflowApiError ? caught.executionId : undefined
        })
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [dictionary, locale, workflowId])

  const errorText = error?.executionId ? `${error.message} ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${error.executionId}` : error?.message
  const orderedSteps = useMemo(() => [...steps].sort((a, b) => a.step_order - b.step_order), [steps])
  const updateDefinition = <Key extends keyof WorkflowDefinition>(key: Key, value: WorkflowDefinition[Key]) => setDefinition(current => ({ ...current, [key]: value }))
  const updateStep = <Key extends keyof WorkflowStepItem>(index: number, key: Key, value: WorkflowStepItem[Key]) => setSteps(current => current.map((step, stepIndex) => stepIndex === index ? { ...step, [key]: value } : step))
  const updateJsonError = (key: string, errorMessage?: string) => {
    setJsonErrors(current => {
      if (errorMessage) return { ...current, [key]: errorMessage }

      return Object.fromEntries(Object.entries(current).filter(([currentKey]) => currentKey !== key))
    })
  }
  const startEditing = () => {
    setSnapshot({ definition: structuredClone(definition), steps: structuredClone(steps) })
    setEditing(true)
    setNotice(null)
  }
  const cancelEditing = () => {
    if (snapshot) { setDefinition(snapshot.definition); setSteps(snapshot.steps) }
    setJsonErrors({}); setEditing(false); setNotice(null)
  }
  const saveLocalChanges = () => {
    const invalidJsonFields = [definition.template_response, definition.workflow_event, ...steps.flatMap(step => [step.sending_template, step.sub_sending_template, step.mapping_response, step.sending_condition, step.worker_id_map])].some(value => !isJson(value))
    if (invalidJsonFields || Object.keys(jsonErrors).length > 0) { setNotice(workflowText(dictionary, 'json_validation_before_save', 'Please correct JSON errors before saving.')); return }
    setEditing(false); setSnapshot(null); setNotice(workflowText(dictionary, 'local_changes_saved', 'Changes are saved locally. An update endpoint has not been configured.'))
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5}>
        <Button onClick={() => router.push(`/${locale}/system-settings/workflows`)} startIcon={<ArrowBackRounded />} sx={{ alignSelf: 'flex-start' }}>{workflowText(dictionary, 'back_to_list', 'Back to workflow list')}</Button>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" startIcon={<AccountTreeRounded />} onClick={() => router.push(getWorkflowDesignerRoute(locale, workflowId))}>{workflowText(dictionary, 'designer_button', 'Workflow designer')}</Button>
          {!editing ? <Button variant="contained" startIcon={<EditRounded />} onClick={startEditing}>{workflowText(dictionary, 'edit_button', 'Edit')}</Button> : <>
            <Button variant="outlined" onClick={cancelEditing}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
            <Button variant="contained" startIcon={<SaveRounded />} onClick={saveLocalChanges}>{commonText(dictionary, 'save', 'Save')}</Button>
          </>}
        </Stack>
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <SectionTitle icon={<AccountTreeRounded fontSize="large" />}>{workflowText(dictionary, 'detail_title', 'Workflow definition details')}</SectionTitle>
        <Typography variant="body2" color="text.secondary">{workflowText(dictionary, 'detail_subtitle', 'Review and edit the workflow definition and its processing steps.')}</Typography>
      </Paper>

      {loading && <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}><CircularProgress /><Typography color="text.secondary">{workflowText(dictionary, 'detail_loading', 'Loading workflow details...')}</Typography></Stack>}
      {!loading && errorText && <Alert severity="error">{errorText}</Alert>}
      {notice && <Alert severity={Object.keys(jsonErrors).length > 0 ? 'error' : 'info'}>{notice}</Alert>}

      {!loading && !error && <>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <SectionTitle icon={<AssignmentRounded fontSize="large" />}>{workflowText(dictionary, 'definition_section_title', 'Definition information')}</SectionTitle>
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth disabled={!editing} label={workflowText(dictionary, 'field_workflow_id', 'Workflow Code')} value={definition.workflow_id} onChange={event => updateDefinition('workflow_id', event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth disabled={!editing} label={workflowText(dictionary, 'field_workflow_name', 'Workflow Name')} value={definition.workflow_name} onChange={event => updateDefinition('workflow_name', event.target.value)} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth disabled={!editing} multiline minRows={3} label={workflowText(dictionary, 'field_description', 'Description')} value={definition.description} onChange={event => updateDefinition('description', event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth disabled={!editing} label={workflowText(dictionary, 'field_channel_id', 'Channel')} value={definition.channel_id} onChange={event => updateDefinition('channel_id', event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><StatusField disabled={!editing} value={definition.status} label={workflowText(dictionary, 'field_status', 'Status')} dictionary={dictionary} onChange={value => updateDefinition('status', value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth disabled={!editing} type="number" label={workflowText(dictionary, 'field_timeout', 'Timeout')} value={definition.timeout ?? ''} onChange={event => updateDefinition('timeout', event.target.value === '' ? null : Number(event.target.value))} /></Grid>
            <Grid size={{ xs: 12 }}><FormControlLabel disabled={!editing} control={<Switch checked={Boolean(definition.is_reverse)} onChange={(_, checked) => updateDefinition('is_reverse', checked)} />} label={workflowText(dictionary, 'field_is_reverse', 'Reversible')} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><JsonEditorField label={workflowText(dictionary, 'field_template_response', 'Response template')} value={definition.template_response} disabled={!editing} error={jsonErrors['definition-template']} dictionary={dictionary} onChange={(value, message) => { updateDefinition('template_response', value); updateJsonError('definition-template', message) }} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}>{isJson(definition.workflow_event) || !definition.workflow_event ? <JsonEditorField label={workflowText(dictionary, 'field_workflow_event', 'Workflow event')} value={definition.workflow_event} disabled={!editing} error={jsonErrors['definition-event']} dictionary={dictionary} onChange={(value, message) => { updateDefinition('workflow_event', value); updateJsonError('definition-event', message) }} /> : <TextField fullWidth disabled={!editing} multiline minRows={3} label={workflowText(dictionary, 'field_workflow_event', 'Workflow event')} value={definition.workflow_event} onChange={event => updateDefinition('workflow_event', event.target.value)} />}</Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <SectionTitle icon={<SettingsSuggestRounded fontSize="large" />}>{workflowText(dictionary, 'steps_section_title', 'Processing steps')}</SectionTitle>
          {orderedSteps.length === 0 ? <Typography color="text.secondary">{workflowText(dictionary, 'steps_empty', 'This workflow has no processing steps.')}</Typography> : orderedSteps.map((step, index) => {
            const originalIndex = steps.indexOf(step)
            const stepKey = `${step.step_order}-${step.step_code}`
            return <Accordion key={stepKey} defaultExpanded={index === 0} disableGutters slotProps={{ transition: { unmountOnExit: true } }} sx={{ mb: 1.5, border: 1, borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ px: 2.5, bgcolor: 'action.hover' }}>
                <Stack direction="row" spacing={1.25} alignItems="center"><Chip size="small" label={step.step_order} color="primary" /><Typography sx={{ fontWeight: 800 }}>{`${workflowText(dictionary, 'step_label', 'Step')} ${step.step_order} - ${step.step_code}`}</Typography></Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12 }}><SectionTitle icon={<CodeRounded />}>{workflowText(dictionary, 'step_general_section', 'General information')}</SectionTitle></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth disabled={!editing} type="number" label={workflowText(dictionary, 'field_step_order', 'Order')} value={step.step_order} onChange={event => updateStep(originalIndex, 'step_order', Number(event.target.value) || 0)} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth disabled={!editing} label={workflowText(dictionary, 'field_step_code', 'Step Code')} value={step.step_code} onChange={event => updateStep(originalIndex, 'step_code', event.target.value)} /></Grid>
                  <Grid size={{ xs: 12, md: 5 }}><TextField fullWidth disabled={!editing} label={workflowText(dictionary, 'field_service_id', 'Service')} value={step.service_id} onChange={event => updateStep(originalIndex, 'service_id', event.target.value)} /></Grid>
                  <Grid size={{ xs: 12, md: 8 }}><TextField fullWidth disabled={!editing} multiline minRows={3} label={workflowText(dictionary, 'field_step_description', 'Description')} value={step.description} onChange={event => updateStep(originalIndex, 'description', event.target.value)} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><StatusField disabled={!editing} value={step.status} label={workflowText(dictionary, 'field_step_status', 'Status')} dictionary={dictionary} onChange={value => updateStep(originalIndex, 'status', value)} /></Grid>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}><SectionTitle icon={<SettingsSuggestRounded />}>{workflowText(dictionary, 'step_processing_section', 'Processing configuration')}</SectionTitle></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth disabled={!editing} label={workflowText(dictionary, 'field_processing_number', 'Processing Type')} value={step.processing_number} onChange={event => updateStep(originalIndex, 'processing_number', event.target.value)} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth disabled={!editing} type="number" label={workflowText(dictionary, 'field_step_timeout', 'Timeout')} value={step.step_timeout ?? ''} onChange={event => updateStep(originalIndex, 'step_timeout', event.target.value === '' ? null : Number(event.target.value))} /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><FormControlLabel disabled={!editing} control={<Switch checked={Boolean(step.should_await_step)} onChange={(_, checked) => updateStep(originalIndex, 'should_await_step', checked)} />} label={workflowText(dictionary, 'field_should_await_step', 'Await Result')} /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><FormControlLabel disabled={!editing} control={<Switch checked={Boolean(step.is_reverse)} onChange={(_, checked) => updateStep(originalIndex, 'is_reverse', checked)} />} label={workflowText(dictionary, 'field_step_is_reverse', 'Reversible')} /></Grid>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}><SectionTitle icon={<SendRounded />}>{workflowText(dictionary, 'step_sending_section', 'Sending data')}</SectionTitle></Grid>
                  {(['sending_template', 'sub_sending_template', 'sending_condition'] as const).map(key => <Grid key={key} size={{ xs: 12, md: 4 }}>{key === 'sending_condition' && step[key] && !isJson(step[key]) ? <TextField fullWidth disabled={!editing} multiline minRows={3} label={workflowText(dictionary, `field_${key}`, key)} value={step[key]} onChange={event => updateStep(originalIndex, key, event.target.value)} /> : <JsonEditorField label={workflowText(dictionary, `field_${key}`, key)} value={step[key]} disabled={!editing} error={jsonErrors[`${stepKey}-${key}`]} dictionary={dictionary} onChange={(value, message) => { updateStep(originalIndex, key, value); updateJsonError(`${stepKey}-${key}`, message) }} />}</Grid>)}
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}><SectionTitle icon={<DataObjectRounded />}>{workflowText(dictionary, 'step_mapping_section', 'Result mapping')}</SectionTitle></Grid>
                  {(['mapping_response', 'worker_id_map'] as const).map(key => <Grid key={key} size={{ xs: 12, md: 6 }}><JsonEditorField label={workflowText(dictionary, `field_${key}`, key)} value={step[key]} disabled={!editing} error={jsonErrors[`${stepKey}-${key}`]} dictionary={dictionary} onChange={(value, message) => { updateStep(originalIndex, key, value); updateJsonError(`${stepKey}-${key}`, message) }} /></Grid>)}
                </Grid>
              </AccordionDetails>
            </Accordion>
          })}
        </Paper>
      </>}
    </Stack>
  )
}

export default WorkflowDetailContent
