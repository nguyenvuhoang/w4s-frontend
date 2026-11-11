'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PaymentsIcon from '@mui/icons-material/Payments'
import {
  Alert,
  Button,
  Paper,
  Stack,
  Typography
} from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'

import FeeTypeForm from './components/FeeTypeForm'
import { commonText, feeText } from './components/feeTypeHelpers'
import type { FeeTypeRouteConfig } from './feeTypeRoutes'
import { useFeeTypeForm } from './hooks/useFeeTypeForm'
import type { FeeDictionary } from './types'

type Props = {
  dictionary: FeeDictionary
  locale: string
  sessiontoken?: string
  error?: string | null
  routes?: FeeTypeRouteConfig
}

const FeeTypeCreatePage = ({
  dictionary,
  locale,
  sessiontoken,
  error,
  routes
}: Props) => {
  const fee_type_form = useFeeTypeForm({
    dictionary,
    locale,
    sessiontoken,
    language: locale,
    mode: 'create',
    routes
  })

  return (
    <ContentWrapper
      title={feeText(dictionary, 'fee_type_create_page_title', 'Create Fee Type')}
      description={feeText(dictionary, 'fee_type_create_page_subtitle', 'Create a new shared fee type.')}
      icon={<PaymentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={fee_type_form.goBack}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            <Button variant="outlined" onClick={fee_type_form.goBack}>
              {commonText(dictionary, 'cancel', 'Cancel')}
            </Button>
            <Button variant="contained" disabled={fee_type_form.saving} onClick={() => void fee_type_form.submit()}>
              {fee_type_form.saving
                ? commonText(dictionary, 'processing', 'Processing...')
                : feeText(dictionary, 'create_action', 'Create')}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {fee_type_form.calculationMethodError && (
          <Alert severity="error">
            {feeText(dictionary, 'calculation_method_codelist_load_failed', 'Unable to load calculation methods.')}
            {fee_type_form.calculationMethodErrorExecutionId && ` ${dictionary.common?.errorReference ?? dictionary.common?.executionid ?? 'Error Reference'}: ${fee_type_form.calculationMethodErrorExecutionId}`}
          </Alert>
        )}
        {fee_type_form.groupTypeError && <Alert severity="error">{feeText(dictionary, 'group_type_codelist_load_failed', 'Unable to load fee type groups.')}</Alert>}

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {feeText(dictionary, 'fee_type_create_form_title', 'Fee Type Information')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feeText(dictionary, 'fee_type_create_form_subtitle', 'Fill in the fields below to create a new fee type.')}
              </Typography>
            </Stack>

            <FeeTypeForm
              dictionary={dictionary}
              locale={locale}
              mode="create"
              values={fee_type_form.values}
              errors={fee_type_form.errors}
              calculationMethodOptions={fee_type_form.calculationMethodOptions}
              calculationMethodLoading={fee_type_form.calculationMethodLoading}
              groupTypeOptions={fee_type_form.groupTypeOptions}
              groupTypeLoading={fee_type_form.groupTypeLoading}
              statusOptions={fee_type_form.statusOptions}
              updateValue={fee_type_form.updateValue}
            />
          </Stack>
        </Paper>
      </Stack>
    </ContentWrapper>
  )
}

export default FeeTypeCreatePage
