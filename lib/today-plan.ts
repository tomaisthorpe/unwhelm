/** A planning day starts at the user's reset hour in their timezone. */
export function getPlanningDayKey(
  date: Date,
  timeZone: string,
  resetHour: number,
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const calendarDay = new Date(
    Date.UTC(value("year"), value("month") - 1, value("day")),
  );
  if (value("hour") < resetHour) {
    calendarDay.setUTCDate(calendarDay.getUTCDate() - 1);
  }
  return calendarDay.toISOString().slice(0, 10);
}

export function isPlannedToday(
  plannedAt: Date | null,
  now: Date,
  timeZone: string,
  resetHour: number,
): boolean {
  return (
    plannedAt !== null &&
    getPlanningDayKey(plannedAt, timeZone, resetHour) ===
      getPlanningDayKey(now, timeZone, resetHour)
  );
}
