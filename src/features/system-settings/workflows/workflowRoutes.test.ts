import { describe, expect, it } from 'vitest'

import { getWorkflowDesignerRoute } from './workflowRoutes'

describe('getWorkflowDesignerRoute', () => {
  it('keeps the designer under the current locale and workflow detail route', () => {
    expect(getWorkflowDesignerRoute('vi', 'WF_BO_ACCEPT_FEE_IMPORT_NOTIFICATION')).toBe('/vi/system-settings/workflows/WF_BO_ACCEPT_FEE_IMPORT_NOTIFICATION/designer')
  })
})
