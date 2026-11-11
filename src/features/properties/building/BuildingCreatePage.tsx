'use client'

import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import CancelIcon from '@mui/icons-material/Cancel'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import { buildingText, commonText } from './buildingHelpers'
import { useBuildingCreateForm } from './hooks/useBuildingCreateForm'
import type { BuildingPageProps } from './types'

const fieldSize = { xs: 12, md: 6 }

/**
 * Create Tower page (/properties/building/create) — WF_BO_CREATE_BUILDING.
 * Project is the working project (read-only); fields: Tower code, Tower name, Floor count, Resident count, Description.
 */
const BuildingCreatePage = ({ dictionary, session, locale }: BuildingPageProps) => {
  const sessiontoken = session?.user?.token ?? undefined
  const form = useBuildingCreateForm({ dictionary, sessiontoken, locale })
  const { values, errors } = form

  return (
    <ContentWrapper
      title={buildingText(dictionary, 'addBuilding', 'Add tower')}
      description={buildingText(dictionary, 'buildingCreateSubtitle', 'Add a new tower to the working project.')}
      icon={<AddBusinessOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            {buildingText(dictionary, 'buildingCreateBreadcrumb', 'Properties / Tower / Add tower')}
          </Typography>

          {form.submitError && <Alert severity="error">{form.submitError}</Alert>}

          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
              {buildingText(dictionary, 'buildingInfo', 'Tower information')}
            </Typography>
            <Grid container spacing={2.5}>
              {/* Working project (project context): shown read-only, sent as project_id. */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {buildingText(dictionary, 'project', 'Project')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {form.project ? formatProjectLabel(form.project) : '-'}
                </Typography>
              </Grid>
              <Grid size={fieldSize}>
                <TextField
                  fullWidth
                  required
                  label={buildingText(dictionary, 'buildingCode', 'Tower code')}
                  value={values.building_code}
                  error={Boolean(errors.building_code)}
                  helperText={errors.building_code}
                  disabled={form.saving}
                  onChange={event => form.updateValue('building_code', event.target.value)}
                />
              </Grid>
              <Grid size={fieldSize}>
                <TextField
                  fullWidth
                  required
                  label={buildingText(dictionary, 'buildingName', 'Tower name')}
                  value={values.name}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  disabled={form.saving}
                  onChange={event => form.updateValue('name', event.target.value)}
                />
              </Grid>
              <Grid size={fieldSize}>
                <TextField
                  fullWidth
                  label={buildingText(dictionary, 'floorCount', 'Floor count')}
                  value={values.floor_count}
                  error={Boolean(errors.floor_count)}
                  helperText={errors.floor_count}
                  disabled={form.saving}
                  onChange={event => form.updateValue('floor_count', event.target.value)}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
              </Grid>
              <Grid size={fieldSize}>
                <TextField
                  fullWidth
                  label={buildingText(dictionary, 'residentCount', 'Resident count')}
                  value={values.resident_count}
                  error={Boolean(errors.resident_count)}
                  helperText={errors.resident_count}
                  disabled={form.saving}
                  onChange={event => form.updateValue('resident_count', event.target.value)}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label={commonText(dictionary, 'description', 'Description')}
                  value={values.description}
                  disabled={form.saving}
                  onChange={event => form.updateValue('description', event.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" startIcon={<CancelIcon fontSize="small" />} disabled={form.saving} onClick={form.backToList}>
              {commonText(dictionary, 'cancel', 'Cancel')}
            </Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon fontSize="small" />} disabled={form.saving} onClick={() => void form.submit()}>
              {form.saving ? commonText(dictionary, 'processing', 'Processing...') : buildingText(dictionary, 'createBuildingSubmit', 'Create tower')}
            </Button>
          </Stack>
        </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default BuildingCreatePage
