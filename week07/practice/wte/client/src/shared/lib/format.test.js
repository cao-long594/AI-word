import { describe, expect, it, vi } from 'vitest'

import { formatDateTime } from './format'

describe('formatDateTime', () => {
  it('formats dates through Intl.DateTimeFormat', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat')
    formatDateTime('2026-04-30T10:00:00Z')
    expect(spy).toHaveBeenCalled()
  })
})
