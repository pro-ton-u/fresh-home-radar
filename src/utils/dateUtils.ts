
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
  } else if (daysRemaining <= 3) {
    return "expiring";
  } else {
    return "fresh";
  }
};

// Convert freshness rating (1-5) to expiry date for fruits
export const freshnessToExpiryDate = (freshness: number): Date => {
  const daysRemaining = freshness;
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
