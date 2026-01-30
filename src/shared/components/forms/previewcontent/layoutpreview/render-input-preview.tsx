import { Locale } from '@/configs/i18n';
import { FormInput } from '@shared/types/systemTypes';
import { isFieldRequired } from '@features/dynamicform/components/layout/rule/isFieldRequired';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Grid, InputAdornment, TextField } from '@mui/material';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale
};

const RenderInputPreviewDefault = ({ input, gridProps, language }: Props) => {

    const required = isFieldRequired(input);

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <TextField
                fullWidth
                size="small"
                placeholder={input.default.condition || ''}
                variant="outlined"
                type={input.config.is_password === 'true' ? 'password' : 'text'}
                label={input.lang?.title?.[language] || input.default?.name || 'Text Input'}
                slotProps={{
                    input: {
                        endAdornment: required ? (
                            <InputAdornment position="end">
                                <AcUnitIcon sx={{ color: 'red !important' }} />
                            </InputAdornment>
                        ) : null,
                    }
                }}
                disabled
            />
        </Grid>
    );
};

export default RenderInputPreviewDefault;

