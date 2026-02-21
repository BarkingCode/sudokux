import {
  getLocalDateString,
  getYesterdayLocalDateString,
  getLocalDayOfWeek,
  getTimezoneOffsetHours,
  getTimezone,
} from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('getLocalDateString', () => {
    it('returns a YYYY-MM-DD formatted string', () => {
      const result = getLocalDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns today\'s date', () => {
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(getLocalDateString()).toBe(expected);
    });
  });

  describe('getYesterdayLocalDateString', () => {
    it('returns a YYYY-MM-DD formatted string', () => {
      const result = getYesterdayLocalDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expected = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      expect(getYesterdayLocalDateString()).toBe(expected);
    });
  });

  describe('getLocalDayOfWeek', () => {
    it('returns a number 0-6 for current day', () => {
      const result = getLocalDayOfWeek();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('returns correct day for a known date string', () => {
      // 2024-01-01 is a Monday (day 1)
      expect(getLocalDayOfWeek('2024-01-01')).toBe(1);
      // 2024-01-07 is a Sunday (day 0)
      expect(getLocalDayOfWeek('2024-01-07')).toBe(0);
    });

    it('returns current day when no argument provided', () => {
      expect(getLocalDayOfWeek()).toBe(new Date().getDay());
    });
  });

  describe('getTimezoneOffsetHours', () => {
    it('returns a number', () => {
      expect(typeof getTimezoneOffsetHours()).toBe('number');
    });

    it('equals negative getTimezoneOffset / 60', () => {
      expect(getTimezoneOffsetHours()).toBe(-new Date().getTimezoneOffset() / 60);
    });
  });

  describe('getTimezone', () => {
    it('returns a non-empty string', () => {
      const tz = getTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });
  });
});
