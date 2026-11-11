import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import {
    Alert,
    Box,
    Checkbox,
    Chip,
    IconButton,
    InputAdornment,
    Pagination,
    Paper,
    Skeleton,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tabs,
    Typography
} from '@mui/material'

import type { useStaffRolePicker } from '../../hooks/useStaffRolePicker'
import type { StaffDictionary } from '../../types'
import { staffText } from '../staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    picker: ReturnType<typeof useStaffRolePicker>
}

const column_count = 3

const RoleAssignmentPicker = ({ dictionary, picker }: Props) => (
    <Stack spacing={2}>
        <Tabs
            value={picker.active_service}
            onChange={(_, service_id) => picker.setActiveService(service_id)}
            variant="fullWidth"
            aria-label={staffText(dictionary, 'role_picker_channel_tabs', 'Role service')}
        >
            <Tab value="BO" label={staffText(dictionary, 'role_picker_back_office', 'Back Office')} />
            <Tab value="MB" label={staffText(dictionary, 'role_picker_mobile_banking', 'Mobile Banking')} />
        </Tabs>

        <TextField
            fullWidth
            size="small"
            label={staffText(dictionary, 'search_label', 'Search')}
            placeholder={staffText(dictionary, 'role_picker_search_placeholder', 'Search by role name or description')}
            value={picker.search_text}
            onChange={event => picker.setSearchText(event.target.value)}
            onKeyDown={event => {
                if (event.key === 'Enter') picker.handleSearchSubmit()
            }}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={picker.handleSearchSubmit}>
                                <SearchIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    )
                }
            }}
        />

        {picker.selected_count > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {staffText(dictionary, 'role_picker_selected_summary', 'Selected {count} role(s).').replace('{count}', String(picker.selected_count))}
                </Typography>
                {picker.selected_roles.map(role => (
                    <Chip
                        key={role.role_id}
                        label={role.role_name || role.role_id}
                        onDelete={() => picker.removeRole(role.role_id)}
                        deleteIcon={<CloseIcon />}
                        color="primary"
                        variant="outlined"
                        size="small"
                    />
                ))}
            </Stack>
        )}

        {picker.load_error ? (
            <Alert severity="error">{picker.load_error}</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25, px: 2 } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell sx={{ fontWeight: 900 }}>{staffText(dictionary, 'field_role_name', 'Role name')}</TableCell>
                            <TableCell sx={{ fontWeight: 900 }}>{staffText(dictionary, 'field_role_description', 'Role description')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {picker.loading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: column_count }).map((__, cell_index) => (
                                        <TableCell key={cell_index}><Skeleton height={24} /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : picker.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={column_count} align="center" sx={{ py: 4 }}>
                                    {staffText(dictionary, 'role_picker_empty_title', 'No role found.')}
                                </TableCell>
                            </TableRow>
                        ) : picker.items.map(role => {
                            const selected = picker.isSelected(role.role_id)

                            return (
                                <TableRow
                                    key={role.role_id}
                                    hover
                                    selected={selected}
                                    onClick={() => picker.toggleRole(role)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selected}
                                            onClick={event => event.stopPropagation()}
                                            onChange={() => picker.toggleRole(role)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>{role.role_name || '-'}</TableCell>
                                    <TableCell>{role.role_description || '-'}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        )}

        {picker.total_count > picker.page_size && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                    page={picker.page_index}
                    count={Math.max(1, Math.ceil(picker.total_count / picker.page_size))}
                    onChange={(_, page) => picker.handlePageChange(page)}
                    color="primary"
                />
            </Box>
        )}
    </Stack>
)

export default RoleAssignmentPicker
