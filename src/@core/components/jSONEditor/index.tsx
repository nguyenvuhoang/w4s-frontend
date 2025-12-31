/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useEffect, useRef } from 'react';

let JSONEditor: any;

if (typeof window !== 'undefined') {
    JSONEditor = require('jsoneditor');
}

type JsonEditorProps = {
    initialJson: object;
    onChange: (updatedJson: object) => void;
    height?: string;
};

const JsonEditorComponent: React.FC<JsonEditorProps> = ({ initialJson, onChange, height = '300px' }) => {
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const editorInstanceRef = useRef<any>(null);
    const modes = ['tree', 'form', 'view', 'code', 'text'];

    useEffect(() => {
        if (typeof window !== 'undefined' && editorContainerRef.current && JSONEditor) {
            editorInstanceRef.current = new JSONEditor(editorContainerRef.current, {
                modes: modes,
                mode: modes[0],
                onChange: () => {
                    try {
                        const updatedJson = editorInstanceRef.current?.get();
                        onChange(updatedJson || {});
                    } catch (error) {
                        console.error('Error updating JSON:', error);
                    }
                },
            });

            editorInstanceRef.current.set(initialJson);
        }

        return () => {
            editorInstanceRef.current?.destroy();
            editorInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (editorInstanceRef.current) {
            editorInstanceRef.current.set(initialJson);
        }
    }, [initialJson]);

    return <div ref={editorContainerRef} style={{ height }} />;
};

export default JsonEditorComponent;
