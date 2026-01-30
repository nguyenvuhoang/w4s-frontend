'use client'

import '@react-pdf-viewer/default-layout/lib/styles/index.css';
// Third-party Imports
import '@assets/iconify-icons/generated-icons.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import 'jsoneditor-react/es/editor.min.css';
import 'jsoneditor/dist/jsoneditor.css';
import 'react-grid-layout/css/styles.css';
import 'react-perfect-scrollbar/dist/css/styles.css';
import 'swiper/swiper-bundle.css';
// Import the styles provided by the react-pdf-viewer packages
import '@/styles/themedark.css';
import 'swiper/css/pagination';
// Generated Icon CSS Imports
import '@/styles/style.css';
// Style Imports
import '@/app/globals.css';
import 'swiper/css';
import 'swiper/css/grid';
import dynamic from 'next/dynamic';
const InitColorSchemeScriptClient = dynamic(
    () => import("@mui/material/InitColorSchemeScript"),
    { ssr: false }
);
const ClientCss = () => {
    return (
        <InitColorSchemeScriptClient attribute="class" />
    )
}

export default ClientCss
