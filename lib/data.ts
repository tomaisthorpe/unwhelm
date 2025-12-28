import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { calculateUrgency, shouldHabitShowAsAvailable } from "./utils";

// Type helper for tasks with context from Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskWithContext = any;

// Get authenticated user session
async function getAuthenticatedSession() {
  const session = (await getServerSession(authOptions)) as Session | null;
  return session;
}

// Server-side data types
export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  project: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  contextId: string;
  dueDate: Date | null;
  waitDays: number | null;
  urgency: number;
  completed: boolean;
  completedAt: Date | null;
  type: "TASK" | "HABIT" | "RECURRING";
  notes: string | null;
  subtasks: Subtask[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  habitType: "STREAK" | "LEARNING" | "WELLNESS" | "MAINTENANCE" | null;
  streak: number | null;
  longestStreak: number | null;
  frequency: number | null;

  nextDue: Date | null;
}

export interface Context {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  coefficient: number;
  shared: boolean;
  archived: boolean;
  isInbox: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  coefficient: number;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTasks(): Promise<Task[]> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return [];
  }

  try {
    // Get all user tags to build coefficient map
    const userTags = await prisma.tag.findMany({
      where: { userId: session.user.id },
    });

    const tagCoefficients: { [tagName: string]: number } = {};
    userTags.forEach((tag: { name: string; coefficient: number }) => {
      tagCoefficients[tag.name.toLowerCase()] = tag.coefficient;
    });

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        context: true,
      },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    });

    const tasksWithUrgency = tasks.map((task: TaskWithContext) => {
      // Parse subtasks from JSON
      let subtasks: Subtask[] = [];
      if (task.subtasks) {
        try {
          subtasks = Array.isArray(task.subtasks) ? task.subtasks : JSON.parse(task.subtasks as string);
        } catch (e) {
          console.error("Failed to parse subtasks for task", task.id, e);
          subtasks = [];
        }
      }

      return {
        ...task,
        priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
        type: task.type as "TASK" | "HABIT" | "RECURRING",
        habitType: task.habitType as
          | "STREAK"
          | "LEARNING"
          | "WELLNESS"
          | "MAINTENANCE"
          | null,
        subtasks,
        urgency: calculateUrgency({
          priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
          dueDate: task.dueDate,
          waitDays: task.waitDays,
          createdAt: task.createdAt,
          tags: task.tags,
          project: task.project,
          contextCoefficient: task.context?.coefficient || 0,
          tagCoefficients,
        }),
      };
    });

    return tasksWithUrgency.sort((a: Task, b: Task) => {
      // For habits, consider them incomplete if they're available for completion
      const aEffectivelyCompleted =
        a.type === "HABIT"
          ? a.completed && !shouldHabitShowAsAvailable(a)
          : a.completed;
      const bEffectivelyCompleted =
        b.type === "HABIT"
          ? b.completed && !shouldHabitShowAsAvailable(b)
          : b.completed;

      if (aEffectivelyCompleted !== bEffectivelyCompleted)
        return aEffectivelyCompleted ? 1 : -1;
      return b.urgency - a.urgency;
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function getContexts(): Promise<Context[]> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const contexts = await prisma.context.findMany({
      where: {
        userId: session.user.id,
        archived: false,
      },
      orderBy: [{ isInbox: "desc" }, { name: "asc" }],
    });

    return contexts;
  } catch (error) {
    console.error("Error fetching contexts:", error);
    return [];
  }
}

export async function getTags(): Promise<Tag[]> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const tags = await prisma.tag.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { name: "asc" },
    });

    return tags;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function getArchivedContexts(): Promise<Context[]> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const contexts = await prisma.context.findMany({
      where: {
        userId: session.user.id,
        archived: true,
      },
      orderBy: { name: "asc" },
    });

    return contexts;
  } catch (error) {
    console.error("Error fetching archived contexts:", error);
    return [];
  }
}

export async function getInboxContext(): Promise<Context | null> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const inboxContext = await prisma.context.findFirst({
      where: {
        userId: session.user.id,
        isInbox: true,
      },
    });

    return inboxContext;
  } catch (error) {
    console.error("Error fetching inbox context:", error);
    return null;
  }
}

export async function getUserContexts(userId: string): Promise<Context[]> {
  try {
    const contexts = await prisma.context.findMany({
      where: {
        OR: [{ userId: userId }, { shared: true }],
        archived: false,
      },
      orderBy: { name: "asc" },
    });

    return contexts;
  } catch (error) {
    console.error("Error fetching user contexts:", error);
    return [];
  }
}

export async function getUserTasks(userId: string): Promise<Task[]> {
  try {
    // Get all user tags to build coefficient map
    const userTags = await prisma.tag.findMany({
      where: { userId },
    });

    const tagCoefficients: { [tagName: string]: number } = {};
    userTags.forEach((tag: { name: string; coefficient: number }) => {
      tagCoefficients[tag.name.toLowerCase()] = tag.coefficient;
    });

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
      },
      include: {
        context: true,
      },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    });

    const tasksWithUrgency = tasks.map((task: TaskWithContext) => {
      // Parse subtasks from JSON
      let subtasks: Subtask[] = [];
      if (task.subtasks) {
        try {
          subtasks = Array.isArray(task.subtasks) ? task.subtasks : JSON.parse(task.subtasks as string);
        } catch (e) {
          console.error("Failed to parse subtasks for task", task.id, e);
          subtasks = [];
        }
      }

      return {
        ...task,
        priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
        type: task.type as "TASK" | "HABIT" | "RECURRING",
        habitType: task.habitType as
          | "STREAK"
          | "LEARNING"
          | "WELLNESS"
          | "MAINTENANCE"
          | null,
        subtasks,
        urgency: calculateUrgency({
          priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
          dueDate: task.dueDate,
          waitDays: task.waitDays,
          createdAt: task.createdAt,
          tags: task.tags,
          project: task.project,
          contextCoefficient: task.context?.coefficient || 0,
          tagCoefficients,
        }),
      };
    });

    return tasksWithUrgency.sort((a: Task, b: Task) => {
      // For habits, consider them incomplete if they're available for completion
      const aEffectivelyCompleted =
        a.type === "HABIT"
          ? a.completed && !shouldHabitShowAsAvailable(a)
          : a.completed;
      const bEffectivelyCompleted =
        b.type === "HABIT"
          ? b.completed && !shouldHabitShowAsAvailable(b)
          : b.completed;

      if (aEffectivelyCompleted !== bEffectivelyCompleted)
        return aEffectivelyCompleted ? 1 : -1;
      return b.urgency - a.urgency;
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return [];
  }
}

// Get tasks due today
export function getTodayTasks(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    })
    .sort((a: Task, b: Task) => {
      // Sort completed tasks to bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Sort by urgency (highest first)
      return b.urgency - a.urgency;
    });
}

// Get context completion (health)
export function getContextCompletion(tasks: Task[], contextId: string) {
  // Only habits contribute to context health, not one-off tasks
  const contextHabits = tasks.filter(
    (task) => task.contextId === contextId && task.type === "HABIT"
  );

  if (contextHabits.length === 0) {
    return { percentage: 100, completed: 0, total: 0 };
  }

  const completed = contextHabits.filter((task) => task.completed).length;
  const total = contextHabits.length;
  const percentage = Math.round((completed / total) * 100);

  return { percentage, completed, total };
}

// Pagination interface
export interface PaginatedResults<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Get completed tasks with pagination
export async function getCompletedTasks(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResults<Task>> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return {
      data: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  try {
    const skip = (page - 1) * pageSize;

    // Get all user tags to build coefficient map
    const userTags = await prisma.tag.findMany({
      where: { userId: session.user.id },
    });

    const tagCoefficients: { [tagName: string]: number } = {};
    userTags.forEach((tag: { name: string; coefficient: number }) => {
      tagCoefficients[tag.name.toLowerCase()] = tag.coefficient;
    });

    // Get total count of completed tasks (exclude habits since they're ongoing behaviors)
    const totalCount = await prisma.task.count({
      where: {
        userId: session.user.id,
        completed: true,
        completedAt: { not: null },
        type: { not: "HABIT" },
      },
    });

    // Get paginated completed tasks (exclude habits since they're ongoing behaviors)
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        completed: true,
        completedAt: { not: null },
        type: { not: "HABIT" },
      },
      include: {
        context: true,
      },
      orderBy: { completedAt: "desc" }, // Most recently completed first
      skip,
      take: pageSize,
    });

    const tasksWithUrgency = tasks.map((task: TaskWithContext) => {
      // Parse subtasks from JSON
      let subtasks: Subtask[] = [];
      if (task.subtasks) {
        try {
          subtasks = Array.isArray(task.subtasks) ? task.subtasks : JSON.parse(task.subtasks as string);
        } catch (e) {
          console.error("Failed to parse subtasks for task", task.id, e);
          subtasks = [];
        }
      }

      return {
        ...task,
        priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
        type: task.type as "TASK" | "HABIT" | "RECURRING",
        habitType: task.habitType as
          | "STREAK"
          | "LEARNING"
          | "WELLNESS"
          | "MAINTENANCE"
          | null,
        subtasks,
        urgency: calculateUrgency({
          priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
          dueDate: task.dueDate,
          waitDays: task.waitDays,
          createdAt: task.createdAt,
          tags: task.tags,
          project: task.project,
          contextCoefficient: task.context?.coefficient || 0,
          tagCoefficients,
        }),
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: tasksWithUrgency,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    return {
      data: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
}

export interface BurndownDataPoint {
  date: string; // YYYY-MM-DD format
  incompleteTasks: number;
  createdTasks: number;
  completedTasks: number;
}

// Get burndown chart data for the past month (excluding habits)
export async function getBurndownData(): Promise<BurndownDataPoint[]> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return [];
  }

  try {
    // Get date range for the past 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Reset times to start/end of day for consistent querying
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all tasks (excluding habits) created or completed in the past 30 days
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        type: { not: "HABIT" }, // Exclude habits
        OR: [
          {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
        completed: true,
      },
    });

    // Also get tasks created before our date range that were still incomplete at the start
    const olderIncompleteTasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        type: { not: "HABIT" },
        createdAt: { lt: startDate },
        OR: [
          { completed: false },
          { completedAt: { gte: startDate } }, // Completed during our range
        ],
      },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
        completed: true,
      },
    });

    // Create array of dates for the past 30 days
    const dates: Date[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    // Calculate initial incomplete count (tasks created before our range that were incomplete)
    let runningIncompleteCount = olderIncompleteTasks.filter(
      (task: { completed: boolean; completedAt: Date | null }) =>
        !task.completed || (task.completedAt && task.completedAt >= startDate)
    ).length;

    // Generate data points for each day
    const dataPoints: BurndownDataPoint[] = dates.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Tasks created on this day
      const createdToday = tasks.filter((task: { createdAt: Date }) => {
        const createdDate = new Date(task.createdAt);
        return createdDate >= date && createdDate < nextDay;
      }).length;

      // Tasks completed on this day
      const completedToday = [...tasks, ...olderIncompleteTasks].filter(
        (task: { completedAt: Date | null }) => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= date && completedDate < nextDay;
        }
      ).length;

      // Update running count
      runningIncompleteCount += createdToday - completedToday;

      return {
        date: date.toISOString().split("T")[0], // YYYY-MM-DD format
        incompleteTasks: Math.max(0, runningIncompleteCount), // Ensure non-negative
        createdTasks: createdToday,
        completedTasks: completedToday,
      };
    });

    return dataPoints;
  } catch (error) {
    console.error("Error fetching burndown data:", error);
    return [];
  }
}

/**
 * Get user's current usage counts for tasks and contexts
 * @returns Object with current task and context counts
 */
export async function getUserUsageCounts(): Promise<{
  tasksCount: number;
  contextsCount: number;
}> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return {
      tasksCount: 0,
      contextsCount: 0,
    };
  }

  try {
    const [tasksCount, contextsCount] = await Promise.all([
      prisma.task.count({
        where: { userId: session.user.id },
      }),
      prisma.context.count({
        where: { userId: session.user.id },
      }),
    ]);

    return {
      tasksCount,
      contextsCount,
    };
  } catch (error) {
    console.error("Error fetching user usage counts:", error);
    return {
      tasksCount: 0,
      contextsCount: 0,
    };
  }
}

// Admin-only functions
export interface UserStats {
  id: string;
  email: string;
  createdAt: Date;
  tasksCount: number;
  contextsCount: number;
  tagsCount: number;
  completedTasksCount: number;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function getAllUserStats(): Promise<UserStats[]> {
  const session = await getAuthenticatedSession();

  if (!session?.user?.id) {
    return [];
  }

  // Check if user is admin
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    return [];
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const userStats = await Promise.all(
      users.map(async (user: { id: string; email: string; createdAt: Date }) => {
        const [tasksCount, contextsCount, tagsCount, completedTasksCount] =
          await Promise.all([
            prisma.task.count({
              where: { userId: user.id },
            }),
            prisma.context.count({
              where: { userId: user.id },
            }),
            prisma.tag.count({
              where: { userId: user.id },
            }),
            prisma.task.count({
              where: { userId: user.id, completed: true },
            }),
          ]);

        return {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          tasksCount,
          contextsCount,
          tagsCount,
          completedTasksCount,
        };
      })
    );

    return userStats;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return [];
  }
}
