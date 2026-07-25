/**
 * Common date utility functions for consistent date manipulation across the app
 */

/**
 * Returns a new Date set to the start of the given day (00:00:00.000)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Returns a new Date set to the end of the given day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Returns a new Date with the specified number of days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns the number of days between two dates (rounded up)
 */
export function diffInLocalCalendarDays(
  target: Date,
  base: Date = new Date()
): number {
  const targetUTC = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const baseUTC = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  return Math.round((targetUTC - baseUTC) / 86400000);
}

/**
 * Returns the number of calendar days between two dates in a specific timezone.
 */
export function diffInCalendarDays(
  target: Date,
  base: Date = new Date(),
  timeZone?: string
): number {
  if (!timeZone) {
    return diffInLocalCalendarDays(target, base);
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const toUtcCalendarDate = (date: Date) => {
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);

    return Date.UTC(year, month - 1, day);
  };

  return Math.round(
    (toUtcCalendarDate(target) - toUtcCalendarDate(base)) / 86400000
  );
}
