'use client'

import { useAdminPropertyContext } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import {
    getResidentStatusColor,
    getResidentStatusLabel
} from '@/features/resident/components/resident-list/residentListHelpers'
import type { getDictionary } from '@/shared/utils/getDictionary'

import { formatPropertyText } from '../propertyFieldHelpers'
import { useApartmentResidentManagement } from './hooks/useApartmentResidentManagement'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.propertyManagement?.[key] ?? fallback
const commonText = (dictionary: Dictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Stack>
)

const emptyText = (value?: string | number | null) => (value === null || value === undefined || value === '' ? '--' : value)

const ApartmentResidentManagementPage = ({
    dictionary,
    sessiontoken,
    apartmentId
}: {
    dictionary: Dictionary
    sessiontoken?: string
    apartmentId: number | null
}) => {
    const router = useRouter()
  const admin = useAdminPropertyContext()
    const params = useParams<{ locale: Locale }>()
    const locale = params.locale
    const unitListHref = `/${locale}${propertyPath('unit', admin)}`

    const { data, loading, error } = useApartmentResidentManagement({
        sessiontoken,
        language: locale,
        apartmentId,
        loadErrorMessage: text(dictionary, 'loadError', 'Unable to load data.')
    })

    const { apartment, residents } = data

    return (
        <ContentWrapper
            title={text(dictionary, 'residentManagementTitle', 'Apartment Resident Management')}
            description={text(dictionary, 'residentManagementSubtitle', 'View apartment information and the residents currently living there.')}
            icon={<PeopleAltIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction="row" justifyContent="flex-end">
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(unitListHref)}>
                        {text(dictionary, 'residentManagementBack', 'Back to apartment list')}
                    </Button>
                </Stack>

                {!apartmentId ? (
                    <Alert severity="warning">{text(dictionary, 'residentManagementNotFound', 'Apartment not found. Please go back to the apartment list.')}</Alert>
                ) : (
                    <>
                        {error && <Alert severity="error">{error}</Alert>}

                        {loading ? (
                            <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                <Skeleton height={32} width="40%" />
                                <Skeleton height={80} />
                                <Skeleton height={80} />
                            </Paper>
                        ) : !error && (
                            <>
                                {apartment ? (
                                    <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                        <Stack spacing={2}>
                                            <Stack direction="row" alignItems="center" gap={1}>
                                                <ApartmentIcon color="primary" />
                                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                    {text(dictionary, 'residentManagementApartmentSection', 'Apartment Information')}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    color={getResidentStatusColor(apartment.status as any) as any}
                                                    label={getResidentStatusLabel(dictionary, apartment.status as any)}
                                                />
                                            </Stack>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}><DetailItem label={text(dictionary, 'apartmentCode', 'Full apartment code')} value={emptyText(apartment.apartment_code)} /></Grid>
                                            </Grid>
                                        </Stack>
                                    </Paper>
                                ) : (
                                    <Alert severity="warning">{text(dictionary, 'residentManagementNotFound', 'Apartment not found. Please go back to the apartment list.')}</Alert>
                                )}

                                <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                    <Stack spacing={2}>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                            {text(dictionary, 'residentManagementResidentsSection', 'Residents')}
                                        </Typography>

                                        {residents.length === 0 ? (
                                            <Alert severity="info">{text(dictionary, 'residentManagementEmptyResidents', 'No residents found for this apartment.')}</Alert>
                                        ) : (
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            {[
                                                                text(dictionary, 'residentManagementTableResidentCode', 'Resident Code'),
                                                                commonText(dictionary, 'loginname', 'Login name'),
                                                                text(dictionary, 'residentManagementTableFullName', 'Full Name'),
                                                                text(dictionary, 'residentManagementTablePhone', 'Phone'),
                                                                text(dictionary, 'residentManagementTableEmail', 'Email'),
                                                                text(dictionary, 'residentManagementTableResidentStatus', 'Resident Status')
                                                            ].map(label => <TableCell key={label} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</TableCell>)}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {residents.map(resident => (
                                                            <TableRow key={resident.resident_id} hover>
                                                                <TableCell sx={{ fontWeight: 700 }}>{emptyText(resident.resident_code)}</TableCell>
                                                                {/* Backend login_name only: "--" when null / empty / blank, never derived from code or email. */}
                                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatPropertyText(resident.login_name)}</TableCell>
                                                                <TableCell>{emptyText(resident.full_name)}</TableCell>
                                                                <TableCell>{emptyText(resident.phone)}</TableCell>
                                                                <TableCell>{emptyText(resident.email)}</TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        size="small"
                                                                        color={getResidentStatusColor(resident.resident_status as any) as any}
                                                                        label={getResidentStatusLabel(dictionary, resident.resident_status as any)}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Stack>
                                </Paper>
                            </>
                        )}
                    </>
                )}
            </Stack>
        </ContentWrapper>
    )
}

export default ApartmentResidentManagementPage
