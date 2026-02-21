import { formatTime, formatTimeWithHours, formatDuration } from '../../src/utils/timeFormatters';

describe('timeFormatters', () => {
  describe('formatTime', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('formats seconds only', () => {
      expect(formatTime(5)).toBe('00:05');
    });

    it('formats minutes and seconds', () => {
      expect(formatTime(332)).toBe('05:32');
    });

    it('formats large values', () => {
      expect(formatTime(3661)).toBe('61:01');
    });

    it('pads single digits', () => {
      expect(formatTime(61)).toBe('01:01');
    });
  });

  describe('formatTimeWithHours', () => {
    it('formats 0 as 00:00:00', () => {
      expect(formatTimeWithHours(0)).toBe('00:00:00');
    });

    it('formats hours minutes seconds', () => {
      expect(formatTimeWithHours(3932)).toBe('01:05:32');
    });

    it('formats seconds only', () => {
      expect(formatTimeWithHours(45)).toBe('00:00:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatTimeWithHours(125)).toBe('00:02:05');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats 0 seconds', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(332)).toBe('5m 32s');
    });

    it('formats exact minutes', () => {
      expect(formatDuration(300)).toBe('5m');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(3900)).toBe('1h 5m');
    });

    it('formats exact hours', () => {
      expect(formatDuration(3600)).toBe('1h');
    });
  });
});
