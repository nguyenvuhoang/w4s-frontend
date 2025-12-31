import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import { Grid, Typography } from '@mui/material';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    formData: any;
    language: Locale;
    rules: RuleStrong[];
};

const RenderLabelDefault = ({ input, gridProps, formData, language, rules }: Props) => {
    // Extract the key of the column
    const columnKey = input.config.structable_read.split('.').pop();

    const value = formData[columnKey] ?? '';

    // Check if the field is hidden based on rules
    const isFieldHidden = (rules: RuleStrong[], columnKey: string): boolean => {
        const visibilityRules = rules.filter(rule => rule.code === 'visibility');

        for (const rule of visibilityRules) {
            const { component_result, component_event, visible } = rule.config || {};
            const resultFields = component_result?.split(';').map((field: string) => field.trim()) || [];

            if (
                resultFields.includes(columnKey) &&
                component_event === 'on_change' &&
                visible === 'false'
            ) {
                return true;
            }
        }
        return false;
    };

    const hidden = isFieldHidden(rules, columnKey);

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }} display={hidden ? 'none' : 'block'}>
            <Typography
                component="label"
                sx={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    display: 'block',
                }}
            >
                {input.lang?.title?.[language] || input.default?.name || 'Label'}
            </Typography>
            {value ? (
                <Typography
                    variant="body1"
                    sx={{
                        backgroundColor: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        display: 'inline-block',
                        width: '100%',
                    }}
                >
                    {value}
                </Typography>
            ) : (
                <Typography
                    variant="body2"
                    sx={{
                        color: '#999',
                        fontStyle: 'italic',
                    }}
                >
                    No data available
                </Typography>
            )}
        </Grid>
    );
};

export default RenderLabelDefault;
