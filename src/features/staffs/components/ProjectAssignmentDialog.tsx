import ApartmentIcon from '@mui/icons-material/Apartment'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
import { useEffect } from 'react'

import { useProjectAssignmentDialog } from '../hooks/useProjectAssignmentDialog'
import type { StaffDictionary } from '../types'
import { commonText, staffText } from './staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    open: boolean
    user_code: string
    already_assigned: { project_code: string; project_name: string }[]
    sessiontoken?: string
    language?: any
    on_close: () => void
    on_assigned: () => Promise<void>
}

const ProjectAssignmentDialog = ({ dictionary, open, user_code, already_assigned, sessiontoken, language, on_close, on_assigned }: Props) => {
    const picker = useProjectAssignmentDialog({ dictionary, sessiontoken, language, user_code, open, already_assigned, on_assigned })

    useEffect(() => {
        if (!open) picker.resetState()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const handleSubmit = async () => {
        const success = await picker.submit()

        if (success) on_close()
    }

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="md"
            onClose={(_, reason) => {
                if (picker.submitting || reason === 'backdropClick' || reason === 'escapeKeyDown') return

                on_close()
            }}
            slotProps={{
                paper: {
                    sx: { borderRadius: 2 }
                }
            }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                <Typography variant="h5" component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>
                    {staffText(dictionary, 'assign_project_title', 'Project assignment')}
                </Typography>
                <IconButton
                    aria-label={commonText(dictionary, 'close', 'Close')}
                    onClick={on_close}
                    disabled={picker.submitting}
                    sx={{ position: 'absolute', right: 16, top: 16 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.5} sx={{ py: 1 }}>
                    {picker.submit_error && <Alert severity="error">{picker.submit_error}</Alert>}

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
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} variant="rounded" height={96} />
                            ))}
                        </Box>
                    ) : picker.items.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: 'center' }}>
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
                                            minHeight: 96,
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
                                        <ApartmentIcon color="action" sx={{ fontSize: 24 }} />
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
                            />
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button disabled={picker.submitting} onClick={on_close}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
                <Button variant="contained" disabled={picker.submitting || picker.selected_count === 0} onClick={handleSubmit}>
                    {picker.submitting ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'confirm', 'Confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ProjectAssignmentDialog
