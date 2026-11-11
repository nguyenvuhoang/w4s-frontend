'use client'

import dynamic from 'next/dynamic'

import 'jsoneditor-react/es/editor.min.css'

const JsonEditor = dynamic(() => import('jsoneditor-react').then(mod => mod.JsonEditor), { ssr: false })

type Props = {
  value?: object
  mode?: 'view' | 'code' | 'tree' | 'form'
  readOnly?: boolean
  height?: number | string
  onChange?: (value: object) => void
}

/**
 * Wrapper dùng chung cho jsoneditor-react — theo đúng convention đã dùng ở
 * src/components/api-manager/apis/detail/LearnApiDetail.tsx và .../modify/LearnApiModify.tsx.
 * Tạo thành shared component để các màn hình khác không phải lặp lại dynamic import.
 */
const JsonViewEditor = ({ value, mode = 'view', readOnly = false, height = 320, onChange }: Props) => (
  <div style={{ height, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 4 }}>
    <JsonEditor
      value={value}
      mode={mode}
      allowedModes={readOnly ? ['view', 'tree', 'code'] : ['tree', 'code', 'form']}
      navigationBar={false}
      statusBar={false}
      onChange={readOnly ? undefined : onChange}
    />
  </div>
)

export default JsonViewEditor
