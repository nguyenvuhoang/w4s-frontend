/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useEffect, useRef } from 'react';

import 'jsoneditor/dist/jsoneditor.min.css';

let JSONEditor: any;

if (typeof window !== 'undefined') {
    JSONEditor = require('jsoneditor');
}

type JsonEditorProps = {
    initialJson?: object;
    initialText?: string;
    onChange?: (updatedJson: object) => void;
    onChangeText?: (updatedText: string) => void;
    height?: string;
    readOnly?: boolean;
    mode?: 'tree' | 'form' | 'view' | 'code' | 'text' | 'preview';
    modes?: Array<'tree' | 'form' | 'view' | 'code' | 'text' | 'preview'>;
};

const getValidInitialText = (initialText: string | undefined) => {
    if (!initialText?.trim()) return null;

    try {
        JSON.parse(initialText);
        return initialText;
    } catch {
        return null;
    }
};

const JsonEditorComponent: React.FC<JsonEditorProps> = ({
    initialJson,
    initialText,
    onChange,
    onChangeText,
    height = '300px',
    readOnly = false,
    mode,
    modes: customModes
}) => {
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const editorInstanceRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);
    const onChangeTextRef = useRef(onChangeText);
    const readOnlyRef = useRef(readOnly);
    const modes: any[] = customModes ?? (readOnly ? ['view'] : ['tree', 'form', 'view', 'code', 'text']);

    useEffect(() => {
        onChangeRef.current = onChange;
        onChangeTextRef.current = onChangeText;
        readOnlyRef.current = readOnly;
    }, [onChange, onChangeText, readOnly]);

    useEffect(() => {
        if (typeof window !== 'undefined' && editorContainerRef.current && JSONEditor) {
            editorInstanceRef.current = new JSONEditor(editorContainerRef.current, {
                modes: modes,
                mode: mode ?? modes[0],
                onEditable: () => !readOnlyRef.current,
                onChange: () => {
                    if (readOnlyRef.current || !onChangeRef.current) return;
                    try {
                        const updatedJson = editorInstanceRef.current?.get();
                        onChangeRef.current?.(updatedJson || {});
                    } catch {}
                },
                onChangeText: (updatedText: string) => {
                    if (readOnlyRef.current) return;
                    onChangeTextRef.current?.(updatedText);
                },
            });

            const validInitialText = getValidInitialText(initialText);

            if (validInitialText !== null) {
                editorInstanceRef.current.setText(validInitialText);
            } else {
                editorInstanceRef.current.set(initialJson ?? {});
            }
        }

        return () => {
            editorInstanceRef.current?.destroy();
            editorInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        const editor = editorInstanceRef.current;
        if (!editor || initialText === undefined) return;

        if (editor.getText() === initialText) return;

        const validInitialText = getValidInitialText(initialText);

        if (validInitialText !== null) {
            editor.setText(validInitialText);
        } else {
            editor.set(initialJson ?? {});
        }
    }, [initialJson, initialText]);

    useEffect(() => {
        if (editorInstanceRef.current && mode) {
            editorInstanceRef.current.setMode(mode);
        }
    }, [mode]);

    useEffect(() => {
        editorInstanceRef.current?.refresh?.();
    }, [readOnly]);

    useEffect(() => {
        if (editorInstanceRef.current && initialText === undefined) {
            editorInstanceRef.current.set(initialJson ?? {});
        }
    }, [initialJson, initialText]);

    return <div ref={editorContainerRef} style={{ height }} />;
};

export default JsonEditorComponent;
