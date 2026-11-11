'use client'

import { Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { feeText } from '../../components/feeTypeHelpers'
import type { FeeDictionary } from '../../types'
import type { GenerateFeeValidationSummary } from '../types'

export type GenerateFeeViewMode = 'preview' | 'sheet'

type Props = {
    dictionary: FeeDictionary
    summary: GenerateFeeValidationSummary
    viewMode: GenerateFeeViewMode
    onViewModeChange: (mode: GenerateFeeViewMode) => void
}

const GenerateFeeSummaryPanel = ({ dictionary, summary, viewMode, onViewModeChange }: Props) => (
    <Stack spacing={2}>
        {summary.report_info && summary.report_info.lines.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    {feeText(dictionary, 'generate_fee_report_info_title', 'Report Information')}
                </Typography>
                <Stack spacing={0.5}>
                    {summary.report_info.lines.map((line, index) => (
                        <Typography key={`${index}-${line}`} variant="body2">
                            {line}
                        </Typography>
                    ))}
                </Stack>
            </Paper>
        )}

        {summary.sheet_preview && (
            <Stack direction="row" justifyContent="flex-end">
                <ToggleButtonGroup
                    exclusive
                    value={viewMode}
                    onChange={(_event, value) => value && onViewModeChange(value)}
                    color="primary"
                    size="small"
                >
                    <ToggleButton value="preview">
                        {feeText(dictionary, 'generate_fee_view_mode_preview', 'Preview Data')}
                    </ToggleButton>
                    <ToggleButton value="sheet">
                        {feeText(dictionary, 'generate_fee_view_mode_sheet', 'View Excel Sheet')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>
        )}
    </Stack>
)

export default GenerateFeeSummaryPanel
