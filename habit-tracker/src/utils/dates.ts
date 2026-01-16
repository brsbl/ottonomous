/**
 * Date utility functions for the habit tracker app.
 * Uses native Date API without external libraries.
 * Week starts on Monday.
 */

/**
 * Format date for display
 * @param date - The date to format
 * @param format - 'short' (Mon), 'medium' (Jan 15), 'full' (Monday, January 15, 2026)
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'full'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    case 'medium':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'full':
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    default:
      return date.toLocaleDateString('en-US');
  }
}

/**
 * Get array of Date objects for current week (Monday to Sunday)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Array of 7 Date objects representing Mon-Sun
 */
export function getWeekDays(referenceDate?: Date): Date[] {
  const date = referenceDate ? new Date(referenceDate) : new Date();
  const dayOfWeek = date.getDay();
  // Convert Sunday (0) to 7 for Monday-based week calculation
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  // Calculate Monday of the current week
  const monday = new Date(date);
  monday.setDate(date.getDate() - adjustedDay + 1);
  monday.setHours(0, 0, 0, 0);

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }

  return weekDays;
}

/**
 * Check if date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return isSameDay(date, today);
}

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates represent the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Convert Date to ISO date string (YYYY-MM-DD)
 * @param date - The date to convert
 * @returns ISO date string in YYYY-MM-DD format
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Date object representing the date at midnight local time
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
