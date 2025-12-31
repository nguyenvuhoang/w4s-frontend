'use client'

/* eslint-disable react-hooks/exhaustive-deps */
import { FormInput } from '@/types/systemTypes';
import { getIcon } from '@/utils/getIcon';
import { Button, Grid } from '@mui/material';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
};

const RenderButtonPreviewDefault = ({
    input,
    gridProps
}: Props) => {



    const iconClass = getIcon(input);

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <Button
                variant="contained"
                color="primary"
                startIcon={iconClass}
                disabled
            >
                {input.default.name || 'Button'}
            </Button>
        </Grid>
    );
};

export default RenderButtonPreviewDefault;
