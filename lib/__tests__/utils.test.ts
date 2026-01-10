/**
 * Tests for utility functions in utils.ts
 */

import {
  cn,
  evaluateUrgency,
  calculateUrgency,
  explainUrgency,
  parseTags,
  formatTagsForInput,
  formatDate,
  getUrgencyColor,
  formatDateForTask,
  shouldHideCompletedTask,
  shouldHabitShowAsAvailable,
  UrgencyInput,
} from "../utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-100");
    expect(typeof result).toBe("string");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-100");
  });

  it("should handle conditional class names", () => {
    const result = cn(
      "base-class",
      true && "conditional-class",
      false && "ignored-class",
    );
    expect(result).toContain("base-class");
    expect(result).toContain("conditional-class");
    expect(result).not.toContain("ignored-class");
  });

  it("should handle undefined and null values", () => {
    const result = cn("text-red-500", undefined, null, "bg-blue-100");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-100");
  });

  it("should merge conflicting Tailwind classes correctly", () => {
    // This tests the twMerge functionality
    const result = cn("p-4", "p-6");
    expect(result).toBe("p-6"); // Should keep the last padding class
  });
});

describe("evaluateUrgency", () => {
  const baseTask: UrgencyInput = {
    priority: "MEDIUM",
    dueDate: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    tags: [],
  };

  it("should calculate urgency for basic task", () => {
    const result = evaluateUrgency(baseTask);
    expect(result.score).toBeGreaterThan(0);
    expect(result.explanation).toBeInstanceOf(Array);
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("should handle different priority levels", () => {
    const lowPriority = evaluateUrgency({ ...baseTask, priority: "LOW" });
    const mediumPriority = evaluateUrgency({ ...baseTask, priority: "MEDIUM" });
    const highPriority = evaluateUrgency({ ...baseTask, priority: "HIGH" });

    expect(highPriority.score).toBeGreaterThan(mediumPriority.score);
    expect(mediumPriority.score).toBeGreaterThan(lowPriority.score);
  });

  it("should calculate age factor correctly", () => {
    const oldTask = {
      ...baseTask,
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
    };
    const newTask = { ...baseTask, createdAt: new Date() };

    const oldResult = evaluateUrgency(oldTask);
    const newResult = evaluateUrgency(newTask);

    expect(oldResult.score).toBeGreaterThan(newResult.score);
  });

  it("should handle due dates correctly", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const overdue = new Date(today);
    overdue.setDate(overdue.getDate() - 1);

    const dueTodayTask = { ...baseTask, dueDate: today };
    const dueTomorrowTask = { ...baseTask, dueDate: tomorrow };
    const overdueTask = { ...baseTask, dueDate: overdue };

    const dueTodayResult = evaluateUrgency(dueTodayTask);
    const dueTomorrowResult = evaluateUrgency(dueTomorrowTask);
    const overdueResult = evaluateUrgency(overdueTask);

    expect(overdueResult.score).toBeGreaterThan(dueTodayResult.score);
    expect(dueTodayResult.score).toBeGreaterThan(dueTomorrowResult.score);
  });

  it("should handle special tags", () => {
    const nextTag = evaluateUrgency({ ...baseTask, tags: ["next"] });
    const blockedTag = evaluateUrgency({ ...baseTask, tags: ["blocked"] });
    const noSpecialTags = evaluateUrgency({ ...baseTask, tags: ["normal"] });

    expect(nextTag.score).toBeGreaterThan(noSpecialTags.score);
    expect(blockedTag.score).toBeLessThan(noSpecialTags.score);
  });

  it("should handle context coefficient", () => {
    const withCoefficient = evaluateUrgency({
      ...baseTask,
      contextCoefficient: 5,
    });
    const withoutCoefficient = evaluateUrgency({
      ...baseTask,
      contextCoefficient: undefined,
    });
    const zeroCoefficient = evaluateUrgency({
      ...baseTask,
      contextCoefficient: 0,
    });

    expect(withCoefficient.score).toBeGreaterThan(withoutCoefficient.score);
    expect(withoutCoefficient.score).toBe(zeroCoefficient.score);
  });

  it("should be case insensitive for tags", () => {
    const upperCaseNext = evaluateUrgency({ ...baseTask, tags: ["NEXT"] });
    const lowerCaseNext = evaluateUrgency({ ...baseTask, tags: ["next"] });
    const mixedCaseNext = evaluateUrgency({ ...baseTask, tags: ["NeXt"] });

    expect(upperCaseNext.score).toBe(lowerCaseNext.score);
    expect(lowerCaseNext.score).toBe(mixedCaseNext.score);
  });

  it("should provide meaningful explanations", () => {
    const task: UrgencyInput = {
      priority: "HIGH",
      dueDate: new Date(),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: ["next"],
      contextCoefficient: 2,
    };

    const result = evaluateUrgency(task);

    expect(
      result.explanation.some((exp) => exp.includes("High priority")),
    ).toBe(true);
    expect(result.explanation.some((exp) => exp.includes("Due in"))).toBe(true);
    expect(result.explanation.some((exp) => exp.includes("Task age"))).toBe(
      true,
    );
    expect(result.explanation.some((exp) => exp.includes("Tag: next"))).toBe(
      true,
    );
    expect(
      result.explanation.some((exp) => exp.includes("Context coefficient")),
    ).toBe(true);
  });
});

describe("calculateUrgency", () => {
  it("should return only the score", () => {
    const task: UrgencyInput = {
      priority: "MEDIUM",
      dueDate: null,
      createdAt: new Date(),
      tags: [],
    };

    const score = calculateUrgency(task);
    const fullResult = evaluateUrgency(task);

    expect(score).toBe(fullResult.score);
    expect(typeof score).toBe("number");
  });
});

describe("explainUrgency", () => {
  it("should return the full result", () => {
    const task: UrgencyInput = {
      priority: "MEDIUM",
      dueDate: null,
      createdAt: new Date(),
      tags: [],
    };

    const explanation = explainUrgency(task);
    const fullResult = evaluateUrgency(task);

    expect(explanation).toEqual(fullResult);
  });
});

describe("waitDays functionality", () => {
  it("should set urgency to 0 when still in wait period", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

    const taskWithWait: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      waitDays: 5, // Wait until 5 days before due date (7 > 5, so still waiting)
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const taskWithoutWait: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const urgencyWithWait = evaluateUrgency(taskWithWait);
    const urgencyWithoutWait = evaluateUrgency(taskWithoutWait);

    // Task with wait should have urgency of 0 since we're still waiting
    expect(urgencyWithWait.score).toBe(0);
    expect(
      urgencyWithWait.explanation.some((exp) => exp.includes("Waiting")),
    ).toBe(true);
    // Task without wait should have normal urgency
    expect(urgencyWithoutWait.score).toBeGreaterThan(0);
  });

  it("should set urgency to 0 when outside wait period", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days from now (within nearWindowDays)

    const taskWithShortWait: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      waitDays: 2, // Wait until 2 days before due date (3 > 2, so urgency should be 0)
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const taskWithoutWait: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const urgencyWithWait = evaluateUrgency(taskWithShortWait);
    const urgencyWithoutWait = evaluateUrgency(taskWithoutWait);

    // Task with wait should have urgency of 0 since 3 > 2 (still waiting)
    expect(urgencyWithWait.score).toBe(0);
    expect(
      urgencyWithWait.explanation.some((exp) => exp.includes("Waiting")),
    ).toBe(true);
    // Task without wait should have normal urgency
    expect(urgencyWithoutWait.score).toBeGreaterThan(0);
  });

  it("should handle waitDays of 0 (no wait)", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days from now

    const task: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      waitDays: 0,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const result = evaluateUrgency(task);
    expect(result.score).toBeGreaterThan(0);
    expect(result.explanation.some((exp) => exp.includes("waiting"))).toBe(
      false,
    );
  });

  it("should calculate normal urgency when wait period has passed", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2); // 2 days from now

    const taskWithWaitPeriodPassed: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      waitDays: 3, // Wait until 3 days before due date (2 <= 3, so wait period has passed)
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const taskWithoutWait: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const urgencyWithWait = evaluateUrgency(taskWithWaitPeriodPassed);
    const urgencyWithoutWait = evaluateUrgency(taskWithoutWait);

    // Both should have the same urgency since wait period has passed
    expect(urgencyWithWait.score).toBeCloseTo(urgencyWithoutWait.score, 2);
    expect(urgencyWithWait.score).toBeGreaterThan(0);
    expect(
      urgencyWithWait.explanation.some((exp) => exp.includes("Waiting")),
    ).toBe(false);
  });

  it("should handle null waitDays (default behavior)", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days from now

    const taskWithNullWait: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      waitDays: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const taskWithoutWaitField: UrgencyInput = {
      priority: "MEDIUM",
      dueDate,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      tags: [],
    };

    const resultWithNull = evaluateUrgency(taskWithNullWait);
    const resultWithoutField = evaluateUrgency(taskWithoutWaitField);

    // Both should have the same urgency (normal behavior)
    expect(resultWithNull.score).toBeCloseTo(resultWithoutField.score, 2);
    expect(resultWithNull.score).toBeGreaterThan(0);
    expect(
      resultWithNull.explanation.some((exp) => exp.includes("Waiting")),
    ).toBe(false);
  });
});

describe("parseTags", () => {
  it("should parse comma-separated tags", () => {
    const result = parseTags("tag1, tag2, tag3");
    expect(result).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("should handle extra whitespace", () => {
    const result = parseTags("  tag1  ,  tag2  ,  tag3  ");
    expect(result).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("should handle empty string", () => {
    const result = parseTags("");
    expect(result).toEqual([]);
  });

  it("should handle whitespace-only string", () => {
    const result = parseTags("   ");
    expect(result).toEqual([]);
  });

  it("should filter out empty tags", () => {
    const result = parseTags("tag1, , tag2, ,");
    expect(result).toEqual(["tag1", "tag2"]);
  });

  it("should handle single tag", () => {
    const result = parseTags("single-tag");
    expect(result).toEqual(["single-tag"]);
  });

  it("should handle tags with special characters", () => {
    const result = parseTags("tag-1, tag_2, tag.3");
    expect(result).toEqual(["tag-1", "tag_2", "tag.3"]);
  });
});

describe("formatTagsForInput", () => {
  it("should join tags with commas", () => {
    const result = formatTagsForInput(["tag1", "tag2", "tag3"]);
    expect(result).toBe("tag1, tag2, tag3");
  });

  it("should handle empty array", () => {
    const result = formatTagsForInput([]);
    expect(result).toBe("");
  });

  it("should handle single tag", () => {
    const result = formatTagsForInput(["single"]);
    expect(result).toBe("single");
  });

  it("should preserve tag content", () => {
    const result = formatTagsForInput(["tag-1", "tag_2", "tag.3"]);
    expect(result).toBe("tag-1, tag_2, tag.3");
  });

  it("should be inverse of parseTags for normal cases", () => {
    const original = ["tag1", "tag2", "tag3"];
    const formatted = formatTagsForInput(original);
    const parsed = parseTags(formatted);
    expect(parsed).toEqual(original);
  });
});

describe("formatDate", () => {
  it('should return "Today" for today', () => {
    const today = new Date();
    const result = formatDate(today);
    expect(result).toBe("Today");
  });

  it('should return "Tomorrow" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = formatDate(tomorrow);
    expect(result).toBe("Tomorrow");
  });

  it('should return "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDate(yesterday);
    expect(result).toBe("Yesterday");
  });

  it("should return days format for near future", () => {
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 3);
    const result = formatDate(nearFuture);
    expect(result).toBe("In 3d");
  });

  it("should return overdue format for past dates", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    const result = formatDate(pastDate);
    expect(result).toBe("3d overdue");
  });

  it("should return full date for far future", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    const result = formatDate(farFuture);
    expect(result).toBe(farFuture.toLocaleDateString());
  });
});

describe("getUrgencyColor", () => {
  it("should return red classes for high urgency", () => {
    const result = getUrgencyColor(15); // Above high threshold
    expect(result).toContain("red");
  });

  it("should return orange classes for medium urgency", () => {
    const result = getUrgencyColor(10); // Between medium and high threshold
    expect(result).toContain("orange");
  });

  it("should return green classes for low urgency", () => {
    const result = getUrgencyColor(3); // Below medium threshold
    expect(result).toContain("green");
  });

  it("should handle boundary values correctly", () => {
    const highResult = getUrgencyColor(14); // Exactly at high threshold
    const mediumResult = getUrgencyColor(7); // Exactly at medium threshold

    expect(highResult).toContain("red");
    expect(mediumResult).toContain("orange");
  });
});

describe("formatDateForTask", () => {
  it("should return null for null date", () => {
    const result = formatDateForTask(null);
    expect(result).toBeNull();
  });

  it("should format today correctly", () => {
    const today = new Date();
    const result = formatDateForTask(today);

    expect(result).not.toBeNull();
    expect(result!.text).toBe("Today");
    expect(result!.color).toContain("blue");
    expect(result!.isOverdue).toBe(false);
  });

  it("should format tomorrow correctly", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = formatDateForTask(tomorrow);

    expect(result).not.toBeNull();
    expect(result!.text).toBe("Tomorrow");
    expect(result!.color).toContain("green");
    expect(result!.isOverdue).toBe(false);
  });

  it("should format yesterday as overdue", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDateForTask(yesterday);

    expect(result).not.toBeNull();
    expect(result!.text).toBe("Yesterday");
    expect(result!.color).toContain("red");
    expect(result!.isOverdue).toBe(true);
  });

  it("should format overdue dates correctly", () => {
    const overdue = new Date();
    overdue.setDate(overdue.getDate() - 3);
    const result = formatDateForTask(overdue);

    expect(result).not.toBeNull();
    expect(result!.text).toBe("3d overdue");
    expect(result!.color).toContain("red");
    expect(result!.isOverdue).toBe(true);
  });

  it("should format near future dates", () => {
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 3);
    const result = formatDateForTask(nearFuture);

    expect(result).not.toBeNull();
    expect(result!.text).toBe("In 3d");
    expect(result!.color).toContain("gray");
    expect(result!.isOverdue).toBe(false);
  });

  it("should format far future dates with full date", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    const result = formatDateForTask(farFuture);

    expect(result).not.toBeNull();
    expect(result!.text).toBe(farFuture.toLocaleDateString());
    expect(result!.color).toContain("gray");
    expect(result!.isOverdue).toBe(false);
  });
});

describe("shouldHideCompletedTask", () => {
  it("should never hide habits", () => {
    const habitTask = {
      completed: true,
      completedAt: new Date("2023-01-01T00:00:00.000Z"),
      type: "HABIT",
    };

    const result = shouldHideCompletedTask(habitTask);
    expect(result).toBe(false);
  });

  it("should not hide uncompleted tasks", () => {
    const task = {
      completed: false,
      completedAt: null,
      type: "TASK",
    };

    const result = shouldHideCompletedTask(task);
    expect(result).toBe(false);
  });

  it("should not hide tasks without completedAt", () => {
    const task = {
      completed: true,
      completedAt: null,
      type: "TASK",
    };

    const result = shouldHideCompletedTask(task);
    expect(result).toBe(false);
  });

  it("should not hide tasks completed today", () => {
    const today = new Date();
    const task = {
      completed: true,
      completedAt: today,
      type: "TASK",
    };

    const result = shouldHideCompletedTask(task);
    expect(result).toBe(false);
  });

  it("should not hide tasks completed less than an hour ago", () => {
    const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000);
    const task = {
      completed: true,
      completedAt: fiftyMinutesAgo,
      type: "TASK",
    };

    const result = shouldHideCompletedTask(task);
    expect(result).toBe(false);
  });

  it("should hide tasks completed before today and more than an hour ago", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // Ensure it's more than an hour ago

    const task = {
      completed: true,
      completedAt: yesterday,
      type: "TASK",
    };

    const result = shouldHideCompletedTask(task);
    expect(result).toBe(true);
  });
});

describe("shouldHabitShowAsAvailable", () => {
  it("should show non-habits based on completion state", () => {
    const task = {
      completed: false,
      completedAt: null,
      type: "TASK",
    };

    const result = shouldHabitShowAsAvailable(task);
    expect(result).toBe(true);
  });

  it("should hide completed non-habits", () => {
    const task = {
      completed: true,
      completedAt: new Date(),
      type: "TASK",
    };

    const result = shouldHabitShowAsAvailable(task);
    expect(result).toBe(false);
  });

  it("should show uncompleted habits", () => {
    const habit = {
      completed: false,
      completedAt: null,
      type: "HABIT",
    };

    const result = shouldHabitShowAsAvailable(habit);
    expect(result).toBe(true);
  });

  it("should show habits with no completedAt based on completion state", () => {
    const completedHabit = {
      completed: true,
      completedAt: null,
      type: "HABIT",
    };

    const result = shouldHabitShowAsAvailable(completedHabit);
    expect(result).toBe(false);
  });

  it("should show habits as available the day after completion", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    const habit = {
      completed: true,
      completedAt: yesterday,
      type: "HABIT",
    };

    const result = shouldHabitShowAsAvailable(habit);
    expect(result).toBe(true);
  });

  it("should not show habits as available on the same day as completion", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const habit = {
      completed: true,
      completedAt: today,
      type: "HABIT",
    };

    const result = shouldHabitShowAsAvailable(habit);
    expect(result).toBe(false);
  });

  it("should show habits as available multiple days after completion", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const habit = {
      completed: true,
      completedAt: threeDaysAgo,
      type: "HABIT",
    };

    const result = shouldHabitShowAsAvailable(habit);
    expect(result).toBe(true);
  });
});

