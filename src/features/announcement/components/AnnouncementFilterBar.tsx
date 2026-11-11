import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'
import FilterSearchForm from '@/shared/components/forms/FilterSearchForm'

import type { AnnouncementDictionary, AnnouncementFilterModel } from '../types'
import { announcementText, commonText, getAnnouncementCategoryLabel, getAnnouncementStatusLabel } from './announcementListHelpers'

type Props = {
    dictionary: AnnouncementDictionary
    locale: string
    filter: AnnouncementFilterModel
    onChange: <K extends keyof AnnouncementFilterModel>(key: K, value: AnnouncementFilterModel[K]) => void
    onSelectChange: <K extends 'category' | 'status'>(key: K, value: AnnouncementFilterModel[K]) => void
    onSearch: () => void
    onReset: () => void
}

const categoryOptions = ['OPERATION', 'NEWS', 'ANNOUNCEMENT', 'EVENT', 'MAINTENANCE', 'OTHER']
const statusOptions = ['A', 'I', 'R']

const AnnouncementFilterBar = ({
    dictionary,
    locale,
    filter,
    onChange,
    onSelectChange,
    onSearch,
    onReset
}: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <FilterSearchForm on_search={onSearch}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                    fullWidth
                    size="small"
                    label={announcementText(dictionary, 'search_text', 'Tìm kiếm')}
                    placeholder={announcementText(dictionary, 'search_placeholder', 'Tìm theo tiêu đề hoặc tóm tắt')}
                    value={filter.search_text}
                    onChange={event => onChange('search_text', event.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={announcementText(dictionary, 'category', 'Danh mục')}
                    value={filter.category}
                    onChange={event => onSelectChange('category', event.target.value)}
                >
                    <MenuItem value="">{commonText(dictionary, 'all', 'Tất cả')}</MenuItem>
                    {categoryOptions.map(category => (
                        <MenuItem key={category} value={category}>
                            {getAnnouncementCategoryLabel(category, locale, dictionary)}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={announcementText(dictionary, 'status', 'Trạng thái')}
                    value={filter.status}
                    onChange={event => onSelectChange('status', event.target.value)}
                >
                    <MenuItem value="">{commonText(dictionary, 'all', 'Tất cả')}</MenuItem>
                    {statusOptions.map(status => (
                        <MenuItem key={status} value={status}>
                            {getAnnouncementStatusLabel(status, locale, dictionary)}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" gap={1}>
                    <Button fullWidth type="submit" variant="contained" startIcon={<SearchIcon />}>
                        {commonText(dictionary, 'search', 'Tìm kiếm')}
                    </Button>
                    <Button fullWidth type="button" variant="outlined" startIcon={<RefreshIcon />} onClick={onReset}>
                        {commonText(dictionary, 'refresh', 'Làm mới')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
      </FilterSearchForm>
    </Paper>
)

export default AnnouncementFilterBar
