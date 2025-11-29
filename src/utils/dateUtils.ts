/**
 * Date utilities for local timezone handling.
 * All functions use device's local timezone for daily challenge features.
 */

/**
 * Get today's date in user's local timezone as YYYY-MM-DD string
 */
export const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get yesterday's date in user's local timezone as YYYY-MM-DD string
 */
export const getYesterdayLocalDateString = (): string => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get day of week for a local date (0 = Sunday, 6 = Saturday)
 */
export const getLocalDayOfWeek = (dateStr?: string): number => {
  if (dateStr) {
    // Parse as local date (add noon time to avoid timezone shifting issues)
    const date = new Date(dateStr + 'T12:00:00');
    return date.getDay();
  }
  return new Date().getDay();
};

/**
 * Get user's timezone offset in hours (e.g., +9 for Tokyo, -5 for New York)
 */
export const getTimezoneOffsetHours = (): number => {
  return -new Date().getTimezoneOffset() / 60;
};

/**
 * Get user's IANA timezone string (e.g., "America/New_York")
 */
export const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
