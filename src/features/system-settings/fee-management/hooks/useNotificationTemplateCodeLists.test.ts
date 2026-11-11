import { describe, expect, it } from 'vitest'

import { getNotificationTemplateStatusCaption } from './useNotificationTemplateCodeLists'

describe('getNotificationTemplateStatusCaption', () => {
  it('uses the IPS_STATUS caption for a known template status', () => {
    expect(getNotificationTemplateStatusCaption(new Map([['A', 'Đang hoạt động']]), 'A')).toBe('Đang hoạt động')
  })

  it('preserves an unknown status value rather than assigning an incorrect caption', () => {
    expect(getNotificationTemplateStatusCaption(new Map([['A', 'Đang hoạt động']]), 'PENDING_REVIEW')).toBe('PENDING_REVIEW')
  })

  it('uses the empty display fallback when no status is returned', () => {
    expect(getNotificationTemplateStatusCaption(new Map(), '')).toBe('-')
  })
})
