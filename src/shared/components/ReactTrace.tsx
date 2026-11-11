'use client'

import { Trace } from '@react-trace/core'
import { OpenEditorPlugin } from '@react-trace/plugin-open-editor'
import { CopyToClipboardPlugin } from '@react-trace/plugin-copy-to-clipboard'
import { PreviewPlugin } from '@react-trace/plugin-preview'

const ReactTrace = () => {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <Trace
      root={process.env.NEXT_PUBLIC_TRACE_ROOT || ''}
      plugins={[
        PreviewPlugin({ disabled: false }),
        CopyToClipboardPlugin(),
        OpenEditorPlugin({ editor: 'vscode' })
      ]}
    />
  )
}

export default ReactTrace