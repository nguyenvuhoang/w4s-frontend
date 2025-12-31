/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Locale } from '@/configs/i18n';
import { MobileContent } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

type Props = {
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    content: MobileContent
};

const RenderDateTimePreview = ({
    content
}: Props) => {

    return (
        <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px', position: 'relative' }} suppressHydrationWarning>
            <DatePicker
                label={content.fieldName || 'Select Date'}
                value={dayjs(new Date())}
                format="DD/MM/YYYY"
                slotProps={{
                    textField: {
                        size: 'small',
                        fullWidth: true,
                        disabled: true,
                        InputLabelProps: {
                            sx: {
                                '& .MuiInputLabel-asterisk': {
                                    color: 'red',
                                },
                            },
                        },
                    },
                    openPickerButton: {
                        sx: {
                            color: '#225087 !important',
                            '& .MuiSvgIcon-root': {
                                color: '#225087 !important',
                            },
                            pointerEvents: 'auto',
                        },
                        children: (
                            <>
                                <CalendarTodayIcon sx={{ marginRight: 1 }} />
                            </>
                        ),
                    },
                }}
            />
        </Grid>
    );
};

export default RenderDateTimePreview;
