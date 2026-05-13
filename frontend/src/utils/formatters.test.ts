import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
} from './formatters'

describe('formatters', () => {
  it('formats INR currency without decimal places', () => {
    expect(formatCurrency(12345)).toContain('12,345')
    expect(formatCurrency(12345)).toContain('₹')
  })

  it('formats an ISO date for the Indian locale', () => {
    expect(formatDate('2026-05-13T00:00:00.000Z')).toBe('13 May 2026')
  })

  it('formats an ISO date-time for the Indian locale', () => {
    const result = formatDateTime('2026-05-13T10:30:00.000Z')

    expect(result).toContain('13 May 2026')
    expect(result).toMatch(/10:30|4:00 pm|04:00 pm/i)
  })

  it('formats durations in hours and minutes', () => {
    expect(formatDuration(135)).toBe('2h 15m')
  })
})
