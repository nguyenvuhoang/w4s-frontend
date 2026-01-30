import { Locale } from '@/configs/i18n';
import { FormInput } from '@shared/types/systemTypes';
import { FormControl, Grid, InputLabel, Select } from '@mui/material';


type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    onChange?: (fieldCode: string, value: string) => void;
    language: Locale;
};

const RenderSelectPreviewDefault = ({ input, gridProps, onChange, language }: Props) => {

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <FormControl fullWidth size="small">
                <InputLabel id={`${input.default.code}-label`}>
                    {input.default.name || 'Select Option'}
                </InputLabel>
                <Select
                    labelId={`${input.default.code}-label`}
                    onChange={(e) =>
                        onChange && onChange(input.default.code, e.target.value as string)
                    }
                    label={input.default.name || 'Select Option'}
                    disabled
                >
                </Select>
            </FormControl>
        </Grid>
    );
};

export default RenderSelectPreviewDefault;

