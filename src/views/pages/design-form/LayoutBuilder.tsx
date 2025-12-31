import { Box } from "@mui/material";
import { useEffect, useState } from "react";

type DeviceView = 'desktop' | 'tablet' | 'mobile';

type Props = {
    selectedView: DeviceView;
};

const LayoutBuilder = ({ selectedView }: Props) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Thiết lập độ rộng tương ứng cho từng thiết bị
        const deviceWidths: Record<DeviceView, number> = {
            desktop: 1200,
            tablet: 768,
            mobile: 375,
        };

        setWidth(deviceWidths[selectedView]);
    }, [selectedView]);

    return (
        <Box
            style={{
                width: `${width}px`,
                border: '2px dashed #ccc',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                height: '80vh', // Thay đổi chiều cao theo ý bạn
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: 'auto', // Căn giữa khung
            }}
        >
            <button
                style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    fontSize: '24px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            >
                +
            </button>
        </Box>
    );
};

export default LayoutBuilder;
