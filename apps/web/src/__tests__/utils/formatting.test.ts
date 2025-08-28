import { formatDate, formatFileSize, formatDuration, truncateText, formatNumber } from '@/utils/formatting'

describe('Formatting Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)

      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('formats date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date, 'yyyy-MM-dd')

      expect(result).toBe('2024-01-15')
    })

    it('handles relative time for recent dates', () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      const result = formatDate(recentDate, 'relative')

      expect(result).toMatch(/5 minutes ago/)
    })

    it('handles null and undefined dates', () => {
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('formats small file sizes', () => {
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('formats large file sizes', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB')
    })

    it('handles decimal precision', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('handles negative values', () => {
      expect(formatFileSize(-1024)).toBe('0 B')
    })
  })

  describe('formatDuration', () => {
    it('formats duration in seconds', () => {
      expect(formatDuration(30)).toBe('30s')
      expect(formatDuration(90)).toBe('1m 30s')
    })

    it('formats duration in minutes', () => {
      expect(formatDuration(120)).toBe('2m')
      expect(formatDuration(3660)).toBe('1h 1m')
    })

    it('formats duration in hours', () => {
      expect(formatDuration(3600)).toBe('1h')
      expect(formatDuration(7320)).toBe('2h 2m')
    })

    it('formats duration in days', () => {
      expect(formatDuration(86400)).toBe('1d')
      expect(formatDuration(90000)).toBe('1d 1h')
    })

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0s')
    })

    it('handles negative duration', () => {
      expect(formatDuration(-30)).toBe('0s')
    })
  })

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated'
      const result = truncateText(longText, 20)

      expect(result).toBe('This is a very long...')
    })

    it('does not truncate short text', () => {
      const shortText = 'Short text'
      const result = truncateText(shortText, 20)

      expect(result).toBe('Short text')
    })

    it('uses custom suffix', () => {
      const longText = 'This is a very long text'
      const result = truncateText(longText, 10, '***')

      expect(result).toBe('This is a***')
    })

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })

    it('handles null and undefined', () => {
      expect(truncateText(null, 10)).toBe('')
      expect(truncateText(undefined, 10)).toBe('')
    })
  })

  describe('formatNumber', () => {
    it('formats whole numbers', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('formats decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
      expect(formatNumber(0.123)).toBe('0.123')
    })

    it('formats with custom decimal places', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1,234.57')
      expect(formatNumber(1234.5678, 0)).toBe('1,235')
    })

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('handles negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234')
    })

    it('handles very large numbers', () => {
      expect(formatNumber(1000000000)).toBe('1,000,000,000')
    })

    it('handles null and undefined', () => {
      expect(formatNumber(null)).toBe('0')
      expect(formatNumber(undefined)).toBe('0')
    })
  })
})
