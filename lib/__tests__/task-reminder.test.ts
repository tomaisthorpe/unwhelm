import { getDueAndOverdueTaskCounts } from "@/lib/badge-utils";
import {
  getTaskReminderMessage,
  isTaskReminderDue,
} from "@/lib/task-reminder";

const baseTask = {
  completed: false,
  completedAt: null,
  type: "TASK" as const,
};

describe("task reminders", () => {
  const now = new Date("2026-07-25T08:00:00.000Z");

  it("separates tasks due today from overdue tasks", () => {
    const counts = getDueAndOverdueTaskCounts(
      [
        { ...baseTask, dueDate: new Date("2026-07-24T00:00:00.000Z") },
        { ...baseTask, dueDate: new Date("2026-07-25T00:00:00.000Z") },
        { ...baseTask, dueDate: new Date("2026-07-26T00:00:00.000Z") },
        { ...baseTask, dueDate: null },
        {
          ...baseTask,
          completed: true,
          completedAt: now,
          dueDate: new Date("2026-07-25T00:00:00.000Z"),
        },
      ],
      now,
      "Europe/London"
    );

    expect(counts).toEqual({ dueToday: 1, overdue: 1, total: 2 });
  });

  it("uses the configured timezone at a calendar-day boundary", () => {
    const counts = getDueAndOverdueTaskCounts(
      [{ ...baseTask, dueDate: new Date("2026-07-25T00:00:00.000Z") }],
      new Date("2026-07-24T23:30:00.000Z"),
      "Europe/London"
    );

    expect(counts).toEqual({ dueToday: 1, overdue: 0, total: 1 });
  });

  it("builds a message containing both counts", () => {
    expect(
      getTaskReminderMessage({ dueToday: 2, overdue: 1, total: 3 })
    ).toEqual({
      title: "3 tasks need attention",
      message:
        "1 overdue · 2 due today. Open Unwhelm to review your task list.",
    });
  });

  it("runs once during the user's configured local hour", () => {
    const schedule = {
      timeZone: "Europe/London",
      hour: 9,
      lastSentAt: null,
    };

    expect(isTaskReminderDue(schedule, new Date("2026-07-25T08:15:00Z"))).toBe(true);
    expect(isTaskReminderDue(schedule, new Date("2026-07-25T07:45:00Z"))).toBe(false);
    expect(
      isTaskReminderDue(
        { ...schedule, lastSentAt: new Date("2026-07-25T08:05:00Z") },
        new Date("2026-07-25T08:30:00Z")
      )
    ).toBe(false);
  });
});
