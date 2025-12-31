/* eslint-disable react-hooks/exhaustive-deps */
import JsonEditorComponent from '@/@core/components/jSONEditor'; // Component JSON Editor
import { FormInput } from '@/types/systemTypes';
import { createRequestHeaderJSON } from '@/utils/createRequestHeaderJSON'; // Hàm tạo JSON mặc định
import { xmlToJson } from '@/utils/xmlToJson';
import { Grid, NoSsr, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    formData: any;
    onChange?: (fieldCode: string, value: any) => void;
    renderviewdata?: any;
};

const RenderTextAreaDefault = ({ input, gridProps, formData, onChange, renderviewdata }: Props) => {

    const columnKey = input.config?.structable_read?.split('.').pop();
    const get_data_format = input.config?.get_data_format;
    const isdatadefault = input.config?.data_default;


    const parseData = (value: any) => {
        if (get_data_format === 'xml') {
            return xmlToJson(value);
        } else if (get_data_format === 'json') {
            return parseJSON(value);
        } else {
            return value;
        }
    };

    const parseJSON = (value: any) => {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (error) {
            console.error('Invalid JSON string:', error);
            return {};
        }
    };

    const initialJson = useMemo(() => {
        const rawValue = formData[columnKey] || renderviewdata?.[input.default?.code] || createRequestHeaderJSON(input);
        return parseData(rawValue);
    }, [formData, columnKey, input]);

    // Trạng thái JSON hiện tại trong editor
    const [jsonContent, setJsonContent] = useState<object>(initialJson);

    // Cập nhật `jsonContent` khi `initialJson` thay đổi
    useEffect(() => {
        setJsonContent(initialJson);
    }, [initialJson]);

    // Xử lý khi JSON trong editor thay đổi
    const handleJsonChange = (updatedJson: object) => {
        console.log('Updated JSON:', updatedJson);
        setJsonContent(updatedJson);

        // Gọi hàm onChange để cập nhật `formData`
        if (onChange && columnKey) {
            onChange(columnKey, updatedJson);
        }
    };

    const isClient = () => typeof window !== 'undefined'

    if (isdatadefault === false && (renderviewdata?.[input.default?.code] === null || renderviewdata?.[input.default?.code] === '')) {
        return null;
    }

    return (
        <NoSsr>
            <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
                <Typography
                    variant="subtitle1"
                    sx={{ marginBottom: '8px', fontFamily: 'Quicksand' }}
                >
                    {input.default.name}
                </Typography>
                {isClient() &&
                    <JsonEditorComponent
                        initialJson={jsonContent}
                        onChange={handleJsonChange}
                    />
                }
            </Grid>
        </NoSsr>
    );
};

export default RenderTextAreaDefault;
