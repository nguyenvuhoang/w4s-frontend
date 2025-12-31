'use client';

import { NoSsr } from '@mui/material';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
const PDFComponent = ({ base64PDF }: { base64PDF: string }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const pdfDataUrl = `data:application/pdf;base64,${base64PDF}`;

    return (
        <NoSsr>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.mjs">
                <Viewer fileUrl={pdfDataUrl} plugins={[defaultLayoutPluginInstance]} />
            </Worker>
        </NoSsr>
    );
};

export default PDFComponent;
