'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import PaymentsIcon from '@mui/icons-material/Payments'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import Link from 'next/link'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import {
  commonText,
  feeText,
  formatFeeAmountWithUnit,
  getCalculationMethodLabel,
  getFeeTypeStatusColor,
  getFeeTypeStatusLabel
} from './components/feeTypeHelpers'
import FeeTypeActionGuard from './components/FeeTypeActionGuard'
import { feeTypeHref, LEGACY_FEE_TYPE_ROUTES, type FeeTypeRouteConfig } from './feeTypeRoutes'
import { useFeeTypeDetail } from './hooks/useFeeTypeDetail'
import { useFeeTypeCalculationMethodCodeList } from './hooks/useFeeTypeCalculationMethodCodeList'
import { useFeeTypeGroupCodeList } from './hooks/useFeeTypeGroupCodeList'
import type { FeeDictionary, FeeTypeItem } from './types'

type Props = {
  dictionary: FeeDictionary
  locale: string
  sessiontoken?: string
  feeType: FeeTypeItem | null
  error?: string | null
  routes?: FeeTypeRouteConfig
}

const actionButtonSx = {
  minWidth: 112,
  height: 36
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
        {children}
      </Box>
    </Stack>
  </Grid>
)

const FeeTypeDetailPage = ({ dictionary, locale, sessiontoken, feeType, error, routes = LEGACY_FEE_TYPE_ROUTES }: Props) => {
  const fee_type_detail = useFeeTypeDetail({
    dictionary,
    locale,
    sessiontoken,
    initialDetail: feeType,
    initialError: error,
    routes
  })
  const { detail, goBack, deleting, deleteFeeType } = fee_type_detail
  const calculationMethods = useFeeTypeCalculationMethodCodeList(locale, detail?.calculation_method ?? '')
  const feeTypeGroups = useFeeTypeGroupCodeList(locale, detail?.group_type ?? '')
  const permission = usePermission({ href: routes.permissionHref ?? routes.basePath })
  // Settings routes have no menu entry; their access is enforced by the System Settings layout.
  const canDelete = routes.permissionHref ? permission.canDelete : true

  const handleDeleteFeeType = () => {
    if (!canDelete) {
      SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

      return
    }

    void deleteFeeType()
  }

  return (
    <ContentWrapper
      title={feeText(dictionary, 'fee_type_detail_page_title', 'Fee Type Detail')}
      description={feeText(dictionary, 'fee_type_detail_page_subtitle', 'View fee type information and available actions.')}
      icon={<PaymentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            <FeeTypeActionGuard routes={routes} action="MODIFY">
              <Button
                component={Link}
                href={feeTypeHref(locale, routes, `/${detail?.id}/edit`)}
                variant="contained"
                startIcon={<EditIcon />}
                sx={actionButtonSx}
                disabled={!detail?.id}
              >
                {commonText(dictionary, 'edit', 'Edit')}
              </Button>
            </FeeTypeActionGuard>
            <FeeTypeActionGuard routes={routes} action="DELETE">
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                sx={actionButtonSx}
                disabled={!detail?.id || deleting}
                onClick={handleDeleteFeeType}
              >
                {deleting
                  ? feeText(dictionary, 'deleting', 'Deleting...')
                  : commonText(dictionary, 'delete', 'Delete')}
              </Button>
            </FeeTypeActionGuard>
          </Stack>
        </Stack>

        {fee_type_detail.error && <Alert severity="error">{fee_type_detail.error}</Alert>}

        {!detail ? (
          <Alert severity={fee_type_detail.error ? 'warning' : 'info'}>
            {feeText(dictionary, 'fee_type_detail_not_found', 'Fee type detail was not found.')}
          </Alert>
        ) : (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {detail.name || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail.fee_type_code || '-'}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  color={getFeeTypeStatusColor(detail.status)}
                  label={getFeeTypeStatusLabel(dictionary, detail.status)}
                  sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                />
              </Stack>

              <Divider />

              <Grid container spacing={3}>
                <DetailRow label={feeText(dictionary, 'field_fee_type_code', 'Fee Type Code')}>
                  <Typography sx={{ fontWeight: 700 }}>{detail.fee_type_code || '-'}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_fee_type_name', 'Fee Type Name')}>
                  <Typography>{detail.name || '-'}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_calculation_method', 'Calculation Method')}>
                  <Typography>{calculationMethods.options.find(option => option.value === detail.calculation_method)?.label ?? getCalculationMethodLabel(dictionary, detail.calculation_method)}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_group_type', 'Fee Type Group')}>
                  <Typography>{(feeTypeGroups.options.find(option => option.value === detail.group_type)?.label ?? detail.group_type) || '-'}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_document_code', 'Document Code')}>
                  <Typography>{detail.document_code || '-'}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_fee_type_name_en', 'Fee Type Name (English)')}>
                  <Typography>{detail.name_translations.en || '-'}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_unit', 'Unit')}>
                  <Typography>{detail.unit || '-'}</Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_default_amount', 'Default Amount')}>
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'success.main' }}>
                    {formatFeeAmountWithUnit(detail.default_amount, locale, detail.unit)}
                  </Typography>
                </DetailRow>
                <DetailRow label={feeText(dictionary, 'field_status', 'Status')}>
                  <Chip size="small" color={getFeeTypeStatusColor(detail.status)} label={getFeeTypeStatusLabel(dictionary, detail.status)} />
                </DetailRow>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      {commonText(dictionary, 'description', 'Description')}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{detail.description || '-'}</Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      {feeText(dictionary, 'field_description_en', 'Description (English)')}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{detail.description_translations.en || '-'}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        )}
      </Stack>
    </ContentWrapper>
  )
}

export default FeeTypeDetailPage
