'use client'

import { memo, useCallback, useLayoutEffect, useRef } from 'react'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography } from '@mui/material'
import { Controller } from 'react-hook-form'

import { FormField } from '@/views/components/form/FormField'

import type { useResidentRelatedMembersForm } from '../../hooks/useResidentRelatedMembersForm'
import { commonText, residentText, type ResidentDictionary } from '../resident-list/residentListHelpers'
import type { NestedValueBridge } from '../../utils/residentNestedJsonValue'
import ResidentRelatedMemberValueEditor from './ResidentRelatedMemberValueEditor'

type Props = {
    dictionary: ResidentDictionary
    editor: ReturnType<typeof useResidentRelatedMembersForm>
}

type MemberRowProps = {
    control: Props['editor']['control']
    index: number
    saved: boolean
    labelError: boolean
    disabled: boolean
    deleteDisabled: boolean
    bridge: NestedValueBridge
    onValidate: () => void
    onDelete: (index: number) => void
    text: (key: string) => string
}

/**
 * One top-level Key/Value row. Memoized with only primitive/stable props: typing re-renders just
 * the Controller of the edited input, never the sibling rows.
 */
const MemberRow = memo(({ control, index, saved, labelError, disabled, deleteDisabled, bridge, onValidate, onDelete, text }: MemberRowProps) => (
    <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={{ xs: 1.5, md: 2 }}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        sx={{ minWidth: 0, pb: { xs: 2, md: 0 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider' }}
    >
        {/* Explicit flex ratios: a fullWidth TextField otherwise grabs the whole row
            and squeezes the value editor (basis 0) down to a sliver. */}
        <Box sx={{ flex: { md: '1 1 0' }, minWidth: 0 }}>
            <FormField
                control={control}
                name={`members.${index}.field_label`}
                required
                label={text('key')}
                disabled={disabled}
                slotProps={{ input: { readOnly: saved } }}
                error={labelError}
                helperText={labelError ? text('key_required') : undefined}
                onBlur={onValidate}
            />
        </Box>
        <Box sx={{ flex: { md: '2 1 0' }, minWidth: 0 }}>
            <Controller
                control={control}
                name={`members.${index}.field_value`}
                render={({ field: valueField }) => (
                    <ResidentRelatedMemberValueEditor
                        value={valueField.value ?? ''}
                        onChange={valueField.onChange}
                        onValidate={onValidate}
                        bridge={bridge}
                        label={text('value')}
                        text={text}
                        disabled={disabled}
                    />
                )}
            />
        </Box>
        <Button
            type="button" color="error" startIcon={<DeleteOutlineIcon />}
            disabled={deleteDisabled}
            onClick={() => onDelete(index)}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap', minHeight: 40, alignSelf: { xs: 'flex-end', md: 'flex-start' } }}
        >
            {text('delete')}
        </Button>
    </Stack>
))

MemberRow.displayName = 'MemberRow'

const ResidentRelatedMembersTab = ({ dictionary, editor }: Props) => {
    const text = useCallback((key: string) => residentText(dictionary, `related_members_${key}`, ''), [dictionary])
    const inputsDisabled = editor.busy || editor.loading || !editor.canModify || !editor.available
    // Stable handlers for memoized rows; they always call the hook's latest functions.
    const latest = useRef(editor)

    useLayoutEffect(() => { latest.current = editor })
    const validate = useCallback(() => latest.current.validate(), [])
    const deleteField = useCallback((index: number) => latest.current.deleteField(index), [])

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Box component="form" noValidate onSubmit={event => { event.preventDefault(); void editor.save() }} aria-busy={editor.busy || editor.loading}>
                <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{text('title')}</Typography>
                        <Button type="button" variant="outlined" startIcon={<AddIcon />} disabled={editor.busy || editor.loading || !editor.canModify || !editor.available} onClick={editor.addField}>
                            {text('add')}
                        </Button>
                    </Stack>

                    {editor.loading && <Stack direction="row" gap={1} alignItems="center" role="status">
                        <CircularProgress size={20} />
                        <Typography color="text.secondary">{text('loading')}</Typography>
                    </Stack>}
                    {editor.error && <Alert severity="error" action={<Button color="inherit" size="small" disabled={editor.busy || editor.loading} onClick={editor.retry}>{text('retry')}</Button>}>
                        {editor.error.message}
                        {editor.error.executionId && <Box component="details" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                            <Box component="summary" sx={{ cursor: 'pointer' }}>{text('error_details')}</Box>
                            {text('error_reference')}: {editor.error.executionId}
                        </Box>}
                    </Alert>}
                    {!editor.error && editor.notice && <Alert severity="warning" action={<Button color="inherit" size="small" disabled={editor.busy || editor.loading} onClick={editor.retry}>{text('retry')}</Button>}>{editor.notice}</Alert>}

                    {!editor.loading && !editor.error && editor.available && editor.fields.length === 0 && <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        {text('empty')}
                    </Typography>}

                    {editor.fields.map((field, index) => (
                        <MemberRow
                            key={field.formKey}
                            control={editor.control}
                            index={index}
                            saved={Boolean(field.field_key)}
                            labelError={Boolean(editor.validation[index]?.field_label)}
                            disabled={inputsDisabled}
                            deleteDisabled={editor.busy || editor.loading || !editor.available || (field.field_key ? !editor.canDelete : !editor.canModify)}
                            bridge={editor.nestedValueBridge(field.clientId)}
                            onValidate={validate}
                            onDelete={deleteField}
                            text={text}
                        />
                    ))}

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }} gap={1.5}
                        justifyContent={editor.isDirty ? 'space-between' : 'flex-end'} alignItems={{ xs: 'stretch', sm: 'center' }}
                        sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}
                    >
                        {editor.isDirty && <Typography variant="body2" color="warning.main">{text('unsaved')}</Typography>}
                        <Button type="submit" variant="contained" disabled={!editor.canModify || !editor.canSave || editor.busy || editor.loading} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, whiteSpace: 'nowrap' }} startIcon={editor.saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
                            {text(editor.saving ? 'saving' : 'save')}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
            <Dialog open={Boolean(editor.deleteTarget)} onClose={editor.closeDelete} disableEscapeKeyDown={editor.deleting} maxWidth="xs" fullWidth>
                <DialogTitle>{text('delete_confirm_title')}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ overflowWrap: 'anywhere' }}>{text('delete_confirm_message').replace('{label}', editor.deleteTarget?.label ?? '')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button disabled={editor.deleting} onClick={editor.closeDelete}>{commonText(dictionary, 'cancel', '')}</Button>
                    <Button color="error" variant="contained" disabled={editor.deleting} onClick={() => void editor.confirmDelete()} startIcon={editor.deleting ? <CircularProgress size={16} color="inherit" /> : undefined}>
                        {text(editor.deleting ? 'deleting' : 'delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    )
}

export default ResidentRelatedMembersTab
