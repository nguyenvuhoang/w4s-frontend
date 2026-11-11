import { Button, Chip, CircularProgress, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'

import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { residentText, type ResidentDictionary } from './residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    total_residents: number
    page_index: number
    total_pages: number
    on_add: () => void
    add_disabled?: boolean
    on_export?: () => void
    export_disabled?: boolean
    exporting?: boolean
}

const ResidentSummaryBar = ({
    dictionary,
    total_residents,
    page_index,
    total_pages,
    on_add,
    add_disabled = false,
    on_export,
    export_disabled = false,
    exporting = false
}: Props) => (
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} flexWrap="wrap">
            <Chip color="primary" label={`${total_residents} ${residentText(dictionary, 'summary_total', 'cư dân')}`} sx={{ fontWeight: 700 }} />
            {total_pages > 0 && (
                <Chip label={`${residentText(dictionary, 'summary_page', 'Trang')} ${page_index}/${total_pages}`} sx={{ fontWeight: 700 }} />
            )}
        </Stack>
        <Stack direction="row" gap={1} justifyContent="flex-end">
            {on_export && (
                <PermissionGuard href="/resident/list" action="EXPORT">
                    <Button
                        type="button"
                        variant="outlined"
                        startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadOutlinedIcon />}
                        onClick={on_export}
                        disabled={export_disabled || exporting}
                    >
                        {residentText(dictionary, 'export_resident_list', 'Xuất Danh Sách Cư Dân')}
                    </Button>
                </PermissionGuard>
            )}
            <PermissionGuard href="/resident/list" action="ADD">
                <Button
                    type="button"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={on_add}
                    disabled={add_disabled}
                    data-tour="resident-add"
                >
                    {residentText(dictionary, 'action_add', 'Thêm cư dân')}
                </Button>
            </PermissionGuard>
        </Stack>
    </Stack>
)

export default ResidentSummaryBar
