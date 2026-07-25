import { prisma } from "../prisma";
import {
  completeRecurringTask,
  type TaskForCompletion,
} from "../task-completion-utils";

const mockTaskCreate = jest.fn();
const mockTaskUpdate = jest.fn();

Object.assign(prisma.task, {
  create: mockTaskCreate,
  update: mockTaskUpdate,
});

describe("completeRecurringTask", () => {
  beforeEach(() => {
    mockTaskCreate.mockReset();
    mockTaskUpdate.mockReset();
  });

  it("copies subtasks to the next occurrence with completion reset", async () => {
    const task: TaskForCompletion = {
      id: "task-1",
      title: "Weekly review",
      priority: "MEDIUM",
      tags: ["review"],
      contextId: "context-1",
      dueDate: new Date("2026-07-05T09:00:00.000Z"),
      waitDays: null,
      type: "RECURRING",
      notes: null,
      subtasks: [
        { id: "subtask-1", text: "Check calendar", completed: true },
        { id: "subtask-2", text: "Plan next week", completed: false },
      ],
      userId: "user-1",
      frequency: 7,
      recurrenceBasis: "DUE_DATE",
      completed: false,
      completedAt: null,
      streak: null,
      longestStreak: null,
    };

    await completeRecurringTask(task, new Date("2026-07-05T10:00:00.000Z"));

    expect(mockTaskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtasks: [
          { id: "subtask-1", text: "Check calendar", completed: false },
          { id: "subtask-2", text: "Plan next week", completed: false },
        ],
      }),
    });
  });

  it("skips missed occurrences while preserving a due-date schedule", async () => {
    const task: TaskForCompletion = {
      id: "task-1",
      title: "Weekly review",
      priority: "MEDIUM",
      tags: ["review"],
      contextId: "context-1",
      dueDate: new Date("2026-07-04T09:00:00.000Z"),
      waitDays: null,
      type: "RECURRING",
      notes: null,
      subtasks: [],
      userId: "user-1",
      frequency: 7,
      recurrenceBasis: "DUE_DATE",
      completed: false,
      completedAt: null,
      streak: null,
      longestStreak: null,
    };

    await completeRecurringTask(task, new Date("2026-07-25T10:00:00.000Z"));

    expect(mockTaskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dueDate: new Date("2026-08-01T09:00:00.000Z"),
        nextDue: new Date("2026-08-01T09:00:00.000Z"),
        recurrenceBasis: "DUE_DATE",
      }),
    });
  });

  it("preserves the existing schedule when completed before the due date", async () => {
    const task: TaskForCompletion = {
      id: "task-1",
      title: "Weekly review",
      priority: "MEDIUM",
      tags: ["review"],
      contextId: "context-1",
      dueDate: new Date("2026-07-27T09:00:00.000Z"),
      waitDays: null,
      type: "RECURRING",
      notes: null,
      subtasks: [],
      userId: "user-1",
      frequency: 7,
      recurrenceBasis: "DUE_DATE",
      completed: false,
      completedAt: null,
      streak: null,
      longestStreak: null,
    };

    await completeRecurringTask(task, new Date("2026-07-25T10:00:00.000Z"));

    expect(mockTaskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dueDate: new Date("2026-08-03T09:00:00.000Z"),
        nextDue: new Date("2026-08-03T09:00:00.000Z"),
      }),
    });
  });

  it("schedules from completion for completion-based recurrence", async () => {
    const task: TaskForCompletion = {
      id: "task-1",
      title: "Clean the filter",
      priority: "MEDIUM",
      tags: ["maintenance"],
      contextId: "context-1",
      dueDate: new Date("2026-07-04T09:00:00.000Z"),
      waitDays: null,
      type: "RECURRING",
      notes: null,
      subtasks: [],
      userId: "user-1",
      frequency: 3,
      recurrenceBasis: "COMPLETION_DATE",
      completed: false,
      completedAt: null,
      streak: null,
      longestStreak: null,
    };

    await completeRecurringTask(task, new Date("2026-07-25T10:00:00.000Z"));

    expect(mockTaskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dueDate: new Date("2026-07-28T10:00:00.000Z"),
        nextDue: new Date("2026-07-28T10:00:00.000Z"),
        recurrenceBasis: "COMPLETION_DATE",
      }),
    });
  });
});
