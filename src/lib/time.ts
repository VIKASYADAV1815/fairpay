/**
 * Format a date into a relative time string
 * e.g., "2 minutes ago", "3 hours ago", "Yesterday", "Jan 15"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // Less than 1 minute
  if (diffSec < 60) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  // Less than 24 hours
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  // Less than 7 days
  if (diffDay < 7) {
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  }

  // More than 7 days - show date
  const month = then.toLocaleString('en-US', { month: 'short' });
  const day = then.getDate();
  
  // If same year, don't show year
  if (then.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }

  // Different year, show year
  return `${month} ${day}, ${then.getFullYear()}`;
}

/**
 * Get a short relative time (for compact UI)
 * e.g., "2m", "3h", "5d", "Jan 15"
 */
export function formatShortRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;

  const month = then.toLocaleString('en-US', { month: 'short' });
  const day = then.getDate();
  return `${month} ${day}`;
}
