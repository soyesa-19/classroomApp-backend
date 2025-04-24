import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts a given timestamp to a cron pattern.
 * @param timestamp - The timestamp to convert (in milliseconds).
 * @returns A string representing the cron pattern.
 */
export const timestampToCron = (timestamp: number): string => {
  const date = new Date(timestamp);

  // Extract minute, hour, day of month, month, and day of week
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const dayOfMonth = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // Months are 0-based in JavaScript
  const dayOfWeek = date.getUTCDay();

  // Format as a cron pattern
  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
};

/**
 * Creates a cron pattern to schedule a task at the end of a specific day (23:59)
 * @param timestamp - Firestore timestamp
 * @returns A string representing the cron pattern for end of day
 */
export const createEndOfDayCronPattern = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  
  // Set time to end of day (23:59)
  const dayOfMonth = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // Months are 0-based in JavaScript
  const dayOfWeek = date.getUTCDay();

  // Format as cron pattern - run at 23:59 on the specific day
  return `59 23 ${dayOfMonth} ${month} ${dayOfWeek}`;
};
