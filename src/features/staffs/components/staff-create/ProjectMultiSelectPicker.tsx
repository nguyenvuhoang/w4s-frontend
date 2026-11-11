import ApartmentIcon from '@mui/icons-material/Apartment'
import SearchIcon from '@mui/icons-material/Search'
import {
    Alert,
    Box,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Pagination,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'

import type { CreateProjectPicker } from '../../hooks/useCreateProjectPicker'
import type { StaffDictionary } from '../../types'
import { staffText } from '../staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    picker: CreateProjectPicker
}

const ProjectMultiSelectPicker = ({ dictionary, picker }: Props) => (
    <Stack spacing={2}>
        <TextField
            fullWidth
            size="small"
            label={staffText(dictionary, 'search_label', 'Search')}
            placeholder={staffText(dictionary, 'assign_project_search_placeholder', 'Search by project code or name')}
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

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={picker.select_all_checked}
                        indeterminate={picker.select_all_indeterminate}
                        disabled={picker.select_all_loading}
                        onChange={() => void picker.handleSelectAllToggle()}
                    />
                }
                label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {staffText(dictionary, 'assign_project_select_all', 'Select all projects')}
                        </Typography>
                        {picker.select_all_loading && <CircularProgress size={14} />}
                    </Stack>
                }
            />
            {picker.selected_count > 0 && (
                <Chip
                    color="primary"
                    variant="outlined"
                    label={staffText(dictionary, 'assign_project_selected_summary', 'Selected {count} project(s).').replace('{count}', String(picker.selected_count))}
                />
            )}
        </Stack>

        {picker.load_error ? (
            <Alert severity="error">{picker.load_error}</Alert>
        ) : picker.loading ? (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' } }}>
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={88} />
                ))}
            </Box>
        ) : picker.items.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {staffText(dictionary, 'assign_project_empty_title', 'No project found.')}
                </Typography>
            </Box>
        ) : (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' } }}>
                {picker.items.map(project => {
                    const selected = picker.isSelected(project.project_code)

                    return (
                        <Paper
                            key={project.project_code}
                            role="button"
                            tabIndex={0}
                            onClick={() => picker.toggleProject(project)}
                            onKeyDown={event => {
                                if (event.key === 'Enter') picker.toggleProject(project)
                            }}
                            sx={{
                                p: 2,
                                minHeight: 88,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: 0.75,
                                cursor: 'pointer',
                                borderRadius: 2,
                                border: 2,
                                borderColor: selected ? 'primary.main' : 'divider',
                                bgcolor: selected ? 'primary.lighterOpacity' : 'background.paper',
                                position: 'relative',
                                outline: 'none',
                                transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: 3,
                                    transform: 'translateY(-1px)'
                                },
                                '&:focus-visible': {
                                    borderColor: 'primary.main',
                                    outline: theme => `2px solid ${theme.palette.primary.main}`,
                                    outlineOffset: 2
                                }
                            }}
                        >
                            <Checkbox
                                checked={selected}
                                onClick={event => event.stopPropagation()}
                                onChange={() => picker.toggleProject(project)}
                                sx={{ position: 'absolute', top: 4, right: 4, p: 0.5 }}
                            />
                            <ApartmentIcon color="action" sx={{ fontSize: 22 }} />
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.3,
                                    pr: 3,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {project.project_name || project.project_code}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{project.project_code}</Typography>
                        </Paper>
                    )
                })}
            </Box>
        )}

        {picker.total_count > picker.page_size && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                <Pagination
                    page={picker.page_index + 1}
                    count={Math.max(1, Math.ceil(picker.total_count / picker.page_size))}
                    onChange={(_, page) => picker.handlePageChange(page)}
                    color="primary"
                    size="small"
                />
            </Box>
        )}
    </Stack>
)

export default ProjectMultiSelectPicker
