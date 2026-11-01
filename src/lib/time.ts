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

/**
 * Group expenses by time period for better list organization
 */
export function getTimeGroup(date: string | Date): 'today' | 'yesterday' | 'this-week' | 'earlier' {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  
  // Reset to start of day for accurate comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thenStart = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  
  const diffDays = Math.floor((todayStart.getTime() - thenStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return 'this-week';
  return 'earlier';
}

export function getTimeGroupLabel(group: 'today' | 'yesterday' | 'this-week' | 'earlier'): string {
  switch (group) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case 'this-week': return 'This Week';
    case 'earlier': return 'Earlier';
  }
}
