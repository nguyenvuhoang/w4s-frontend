import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material'

import { ResidentApartmentFormValue } from '../../types'
import { localizedCatalogLabel } from '../../utils/residentLabels'
import { ResidentDictionary, text } from './formControls'

type Props = {
    dict: ResidentDictionary
    apartments: ResidentApartmentFormValue[]
    onEditApartment: (row: ResidentApartmentFormValue) => void
    onRemoveApartment: (id: string) => void
    highlightedApartmentId?: string | null
}

export function ApartmentListTable({ dict, apartments, onEditApartment, onRemoveApartment, highlightedApartmentId }: Props) {
    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{text(dict, 'apartment_code', 'Mã căn hộ')}</TableCell>
                        <TableCell>{text(dict, 'apartment_type', 'Loại căn hộ')}</TableCell>
                        <TableCell>{text(dict, 'electric_meter_code', 'Mã đồng hồ điện')}</TableCell>
                        <TableCell>{text(dict, 'water_meter_code', 'Mã đồng hồ nước')}</TableCell>
                        <TableCell>{text(dict, 'role', 'Quyền cư dân')}</TableCell>
                        <TableCell>{text(dict, 'relationship_type', 'Loại cư dân')}</TableCell>
                        <TableCell>{text(dict, 'move_in_date', 'Ngày bắt đầu ở')}</TableCell>
                        <TableCell align="right">{text(dict, 'actions', 'Thao tác')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {apartments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8}>
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                    {text(dict, 'no_apartment_added', 'Chưa có căn hộ nào được thêm.')}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : apartments.map(row => (
                        <TableRow
                            key={row.id}
                            hover
                            sx={{
                                transition: 'background-color 600ms ease',
                                bgcolor: row.id === highlightedApartmentId ? 'rgba(255, 213, 79, 0.35)' : undefined
                            }}
                        >
                            <TableCell>{row.apartmentCode}</TableCell>
                            <TableCell>{localizedCatalogLabel(dict, row.apartmentType, row.apartmentTypeLabel) || '-'}</TableCell>
                            <TableCell>{row.electricMeterCode || '-'}</TableCell>
                            <TableCell>{row.waterMeterCode || '-'}</TableCell>
                            <TableCell>{row.residentRoleLabel || row.residentRole || '-'}</TableCell>
                            <TableCell>{row.apartmentRelationshipLabel || row.apartmentRelationship || '-'}</TableCell>
                            <TableCell>{row.moveInDate || '-'}</TableCell>
                            <TableCell align="right">
                                <Stack direction="row" justifyContent="flex-end" gap={1}>
                                    <Tooltip title={text(dict, 'edit', 'Edit')}>
                                        <IconButton size="small" onClick={() => onEditApartment(row)}>
                                            <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={text(dict, 'delete', 'Delete')}>
                                        <IconButton size="small" color="error" onClick={() => onRemoveApartment(row.id)}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
