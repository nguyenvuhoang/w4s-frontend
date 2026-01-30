/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import JsonEditorComponent from '@/@core/components/jSONEditor'; // Component JSON Editor
import { FormInput } from '@shared/types/systemTypes';
import { Grid, NoSsr, Typography } from '@mui/material';
import { useState } from 'react';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
};

const RenderTextAreaPreviewDefault = ({ input, gridProps }: Props) => {

    // Tráº¡ng thÃ¡i JSON hiá»‡n táº¡i trong editor
    const [jsonContent, setJsonContent] = useState<object>({});


    return (
        <NoSsr>
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px' }}>
                {/* Label náº±m trÃªn JsonEditorComponent */}
                <Typography
                    variant="subtitle1"
                    sx={{ marginBottom: '8px', fontWeight: 'bold' }} // Style tÃ¹y chá»‰nh cho label
                >
                    {input.default.name}
                </Typography>
                <JsonEditorComponent
                    initialJson={jsonContent}
                    onChange={(updatedJson: object) => setJsonContent(updatedJson)}
                />
            </Grid>
        </NoSsr>
    );
};

export default RenderTextAreaPreviewDefault;

