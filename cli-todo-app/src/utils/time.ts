/**
 * Time utilities for formatting relative timestamps
 */

/**
 * Convert an ISO date string to a human-readable relative time string
 * @param isoDate - ISO 8601 formatted date string
 * @returns Relative time string like "just now", "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function relativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Handle future dates or invalid dates
  if (diffMs < 0 || isNaN(diffMs)) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'just now';
  }

  if (minutes === 1) {
    return '1 minute ago';
  }

  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  if (hours === 1) {
    return '1 hour ago';
  }

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  if (days === 1) {
    return '1 day ago';
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  if (weeks === 1) {
    return '1 week ago';
  }

  if (weeks < 4) {
    return `${weeks} weeks ago`;
  }

  if (months === 1) {
    return '1 month ago';
  }

  if (months < 12) {
    return `${months} months ago`;
  }

  if (years === 1) {
    return '1 year ago';
  }

  return `${years} years ago`;
}
