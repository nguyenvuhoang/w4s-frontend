import { getDictionary } from '@/utils/getDictionary';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, RadioGroup, FormControlLabel, Radio,
    TextField, Stack, FormHelperText
} from '@mui/material';
import { useState, useMemo } from 'react';

type RejectReasonModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    reasons?: string[];
    loading?: boolean;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
};

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
    open, onClose, onConfirm, reasons, loading, dictionary
}) => {
    const OTHER = '__OTHER__';
    const fallbackReasons = [
        dictionary['rejectreason'].rejectreasondefault,
        dictionary['rejectreason'].rejectreason1,
        dictionary['rejectreason'].rejectreason2,
        dictionary['rejectreason'].rejectreason3,
    ];
    const list = useMemo(
        () => (Array.isArray(reasons) && reasons.length > 0 ? reasons : fallbackReasons),
        [reasons]
    );

    const [selected, setSelected] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleConfirm = () => {
        const finalReason = selected === OTHER ? customReason.trim() : selected.trim();
        if (!finalReason) {
            setError(dictionary['contract'].rejectreasonrequired);
            return;
        }
        setError('');
        onConfirm(finalReason);
    };

    const resetState = () => {
        setSelected('');
        setCustomReason('');
        setError('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {dictionary['rejectreason'].rejectreasontitle}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    <RadioGroup
                        value={selected}
                        onChange={(e) => { setSelected(e.target.value); setError(''); }}
                    >
                        {list.map((r) => (
                            <FormControlLabel key={r} value={r} control={<Radio />} label={r} />
                        ))}
                        <FormControlLabel value={OTHER} control={<Radio />} label={dictionary['navigation'].others} />
                    </RadioGroup>

                    {selected === OTHER && (
                        <TextField
                            autoFocus
                            fullWidth
                            label={dictionary['rejectreason'].rejectreasonplaceholder}
                            value={customReason}
                            onChange={(e) => { setCustomReason(e.target.value); setError(''); }}
                            multiline
                            minRows={2}
                        />
                    )}

                    {!!error && <FormHelperText error>{error}</FormHelperText>}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ mt: 5 }}>
                <Button onClick={handleClose} variant='outlined' color='error' disabled={loading}>
                    {dictionary['common'].cancel ?? 'Hủy'}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {dictionary['common'].confirm}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RejectReasonModal;
