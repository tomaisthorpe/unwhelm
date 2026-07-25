import type { DueAndOverdueTaskCounts } from "@/lib/badge-utils";

type ReminderSchedule = {
  timeZone: string;
  hour: number;
  lastSentAt: Date | null;
};

function getZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

export function isTaskReminderDue(
  schedule: ReminderSchedule,
  now: Date = new Date()
) {
  const current = getZonedDateParts(now, schedule.timeZone);
  if (current.hour !== schedule.hour) return false;
  if (!schedule.lastSentAt) return true;

  return (
    getZonedDateParts(schedule.lastSentAt, schedule.timeZone).date !==
    current.date
  );
}

function taskLabel(count: number) {
  return count === 1 ? "task" : "tasks";
}

export function getTaskReminderMessage(counts: DueAndOverdueTaskCounts) {
  const parts: string[] = [];

  if (counts.overdue > 0) {
    parts.push(`${counts.overdue} overdue`);
  }

  if (counts.dueToday > 0) {
    parts.push(`${counts.dueToday} due today`);
  }

  return {
    title: `${counts.total} ${taskLabel(counts.total)} need attention`,
    message: `${parts.join(" · ")}. Open Unwhelm to review your task list.`,
  };
}
