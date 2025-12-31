declare module 'jsoneditor-react' {
    import { ComponentType } from 'react';

    export interface JsonEditorProps {
        value?: object;
        onChange?: (updatedJson: object) => void;
        mode?: 'tree' | 'view' | 'form' | 'code' | 'text';
        allowedModes?: ('tree' | 'view' | 'form' | 'code' | 'text')[];
        history?: boolean;
        search?: boolean;
        navigationBar?: boolean;
        statusBar?: boolean;
        onError?: (error: Error) => void;
    }

    export const JsonEditor: ComponentType<JsonEditorProps>;
}
