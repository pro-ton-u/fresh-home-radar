
// Format date to readable string
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

// Calculate days remaining until a date
export const getDaysRemaining = (date: Date | string): number => {
  const targetDate = new Date(date);
  const today = new Date();
  
  // Reset time part for accurate day calculation
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Get status based on days remaining
export const getExpiryStatus = (daysRemaining: number): "expired" | "expiring" | "fresh" => {
  if (daysRemaining < 0) {
    return "expired";
  } else if (daysRemaining <= 1) {
    return "expiring";
  } else {
    return "fresh";
  }
};

// Convert freshness rating (1-5) to expiry date for fruits
export const freshnessToExpiryDate = (freshness: number): Date => {
  // Each heart represents 0.6 days of freshness (5 hearts = 3 days)
  const daysRemaining = freshness * 0.6;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysRemaining);
  return expiryDate;
};

// Format relative time (e.g., "2 days ago", "in 3 days")
export const formatRelativeTime = (date: Date | string): string => {
  const daysRemaining = getDaysRemaining(date);
  
  if (daysRemaining === 0) {
    return "Today";
  } else if (daysRemaining === 1) {
    return "Tomorrow";
  } else if (daysRemaining === -1) {
    return "Yesterday";
  } else if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} days ago`;
  } else {
    return `in ${daysRemaining} days`;
  }
};

// Get detailed time remaining for fruits (hours, minutes, seconds)
export const getDetailedTimeRemaining = (expiryDate: Date | string): string => {
  const now = new Date();
  const targetDate = new Date(expiryDate);
  
  // Get the difference in milliseconds
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Expired";
  }
  
  // Convert to hours, minutes, seconds
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  // Format the time remaining
  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    return `${days}d ${hours}h ${diffMinutes}m`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m ${diffSeconds}s`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds}s`;
  } else {
    return `${diffSeconds}s`;
  }
};
