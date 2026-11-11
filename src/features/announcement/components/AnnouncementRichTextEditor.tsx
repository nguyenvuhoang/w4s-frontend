'use client'

import { CKEditor } from '@ckeditor/ckeditor5-react'
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document'
import { Box, FormHelperText } from '@mui/material'
import { memo, useRef } from 'react'

type Props = {
    value: string
    disabled?: boolean
    error?: string
    editorHeight?: number | string
    lockEditorHeight?: boolean
    onChange: (value: string) => void
    onReady?: (editor: any) => void
}

const AnnouncementRichTextEditor = memo(function AnnouncementRichTextEditor({
    value,
    disabled,
    error,
    editorHeight = 280,
    lockEditorHeight = false,
    onChange,
    onReady
}: Props) {
    const toolbarRef = useRef<HTMLDivElement | null>(null)

    return (
        <>
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: error ? 'error.main' : 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '& .announcement-editor-toolbar': {
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    },
                    '& .announcement-editor-toolbar .ck.ck-toolbar': {
                        border: 0
                    },
                    '& .ck-editor__main .ck-content': {
                        minHeight: editorHeight,
                        ...(lockEditorHeight ? { height: editorHeight, maxHeight: editorHeight, overflowY: 'auto' } : {}),
                        color: '#1f2937',
                        border: 0
                    },
                    '& .ck.ck-editor__editable:not(.ck-editor__nested-editable).ck-focused': {
                        boxShadow: 'none',
                        border: 0
                    }
                }}
            >
                <Box ref={toolbarRef} className="announcement-editor-toolbar" />
                <CKEditor
                    editor={DecoupledEditor as any}
                    data={value}
                    disabled={disabled}
                    config={{
                        toolbar: {
                            items: [
                                'bold',
                                'italic',
                                'underline',
                                'strikethrough',
                                '|',
                                'fontFamily',
                                'fontSize',
                                'fontColor',
                                'fontBackgroundColor',
                                '|',
                                'insertTable',
                                '|',
                                'heading',
                                '|',
                                'alignment',
                                '|',
                                'bulletedList',
                                'numberedList',
                                'outdent',
                                'indent',
                                '|',
                                'link',
                                'uploadImage',
                                '|',
                                'undo',
                                'redo'
                            ],
                            shouldNotGroupWhenFull: false
                        },
                        alignment: {
                            options: ['left', 'center', 'right', 'justify']
                        },
                        fontFamily: {
                            supportAllValues: true
                        },
                        fontSize: {
                            options: [10, 12, 14, 'default', 18, 20, 24, 28, 32],
                            supportAllValues: true
                        },
                        image: {
                            toolbar: [
                                'imageStyle:inline',
                                'imageStyle:block',
                                'imageStyle:side',
                                '|',
                                'toggleImageCaption',
                                'imageTextAlternative'
                            ]
                        },
                        table: {
                            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                        }
                    }}
                    onReady={(editor: any) => {
                        const toolbarElement = editor.ui.view.toolbar.element

                        if (toolbarRef.current && toolbarElement) {
                            toolbarRef.current.replaceChildren(toolbarElement)
                        }

                        onReady?.(editor)
                    }}
                    onChange={(_, editor) => onChange(editor.getData())}
                />
            </Box>
            {error && <FormHelperText error>{error}</FormHelperText>}
        </>
    )
})

export default AnnouncementRichTextEditor
