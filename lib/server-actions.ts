"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import {
  calculateUrgency,
  parseTags,
  shouldHabitShowAsAvailable,
} from "./utils";
import {
  completeTask,
  uncompleteHabit,
  toggleRegularTask,
  TaskForCompletion,
} from "./task-completion-utils";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { FEATURE_LIMITS, FEATURE_LIMIT_ERRORS } from "./feature-limits";

// Get authenticated user or redirect
async function getAuthenticatedUser() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  return session.user.id;
}

// Helper function to create an inbox context for a user
export async function createInboxContext(userId: string) {
  try {
    const inboxContext = await prisma.context.create({
      data: {
        name: "Inbox",
        description: "Default context for new tasks",
        icon: "Inbox",
        color: "bg-blue-500",
        coefficient: 0.0,
        isInbox: true,
        userId,
      },
    });
    return inboxContext;
  } catch (error) {
    console.error("Error creating inbox context:", error);
    throw error;
  }
}

// Helper function to get or create user's inbox context
export async function getOrCreateInboxContext(userId: string) {
  // First try to find existing inbox
  let inboxContext = await prisma.context.findFirst({
    where: { userId, isInbox: true },
  });

  // If no inbox exists, create one
  if (!inboxContext) {
    inboxContext = await createInboxContext(userId);
  }

  return inboxContext;
}

// Server action to toggle task completion
export async function toggleTaskAction(taskId: string) {
  const userId = await getAuthenticatedUser();

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const now = new Date();

  // Handle different task types
  if (task.type === "HABIT") {
    // For habits, determine action based on UI availability state
    const habitShowsAsAvailable = shouldHabitShowAsAvailable({
      completed: task.completed,
      completedAt: task.completedAt,
      type: task.type,
    });

    if (habitShowsAsAvailable) {
      // Habit shows as available, so we're completing it
      await completeTask(task as TaskForCompletion, now);
    } else {
      // Habit shows as completed, so we're uncompleting it
      await uncompleteHabit(task as TaskForCompletion);
    }
  } else if (task.type === "RECURRING" && !task.completed) {
    // Recurring task is being completed
    await completeTask(task as TaskForCompletion, now);
  } else {
    // Regular task toggle or other cases
    await toggleRegularTask(taskId, task.completed, now);
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/completed");
}

// Server action to mark task as completed yesterday
export async function completeTaskYesterdayAction(taskId: string) {
  const userId = await getAuthenticatedUser();

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Calculate yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // Set to end of yesterday for completion time
  yesterday.setHours(23, 59, 59, 999);

  // Complete the task for yesterday (only if not already completed)
  if (!task.completed) {
    await completeTask(task as TaskForCompletion, yesterday);
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/completed");
}

// Server action to create a new task
export async function createTaskAction(formData: FormData) {
  const userId = await getAuthenticatedUser();

  // Feature gating: Check if user has reached the maximum number of tasks
  const taskCount = await prisma.task.count({
    where: { userId },
  });

  if (taskCount >= FEATURE_LIMITS.MAX_TASKS) {
    throw new Error(FEATURE_LIMIT_ERRORS.MAX_TASKS);
  }

  const title = formData.get("title") as string;
  const priority =
    (formData.get("priority") as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM";
  const contextId = formData.get("contextId") as string;
  const dueDate = formData.get("dueDate") as string;
  const waitDays = formData.get("waitDays")
    ? parseInt(formData.get("waitDays") as string)
    : null;
  const type =
    (formData.get("type") as "TASK" | "HABIT" | "RECURRING") || "TASK";
  const habitType = formData.get("habitType") as
    | "STREAK"
    | "LEARNING"
    | "WELLNESS"
    | "MAINTENANCE";
  const frequency = formData.get("frequency")
    ? parseInt(formData.get("frequency") as string)
    : null;
  const tagsString = formData.get("tags") as string;
  const notes = formData.get("notes") as string;
  const subtasksString = formData.get("subtasks") as string;

  if (!title) {
    throw new Error("Title is required");
  }

  // Use provided context or fallback to inbox
  let finalContextId = contextId;
  if (!contextId) {
    const inboxContext = await getOrCreateInboxContext(userId);
    finalContextId = inboxContext.id;
  }

  // Verify context belongs to user
  const context = await prisma.context.findFirst({
    where: { id: finalContextId, userId },
  });

  if (!context) {
    throw new Error("Context not found");
  }

  const tags = parseTags(tagsString || "");

  // Parse subtasks JSON
  let subtasks = [];
  if (subtasksString) {
    try {
      subtasks = JSON.parse(subtasksString);
    } catch {
      // If parsing fails, default to empty array
      subtasks = [];
    }
  }

  // Prepare task data based on type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskData: any = {
    title,
    priority,
    tags,
    contextId: finalContextId,
    dueDate: dueDate ? new Date(dueDate) : null,
    waitDays,
    type,
    notes: notes || null,
    subtasks: subtasks,
    userId,
  };

  // Set type-specific fields
  if (type === "HABIT") {
    taskData.habitType = habitType;
    taskData.frequency = frequency;
  } else if (type === "RECURRING") {
    taskData.frequency = frequency;
    if (dueDate) {
      taskData.nextDue = new Date(dueDate);
    }
  }

  await prisma.task.create({
    data: taskData,
  });

  revalidatePath("/tasks");
}

// Server action to update an existing task
export async function updateTaskAction(formData: FormData) {
  const userId = await getAuthenticatedUser();

  const taskId = formData.get("taskId") as string;
  const title = formData.get("title") as string;
  const priority =
    (formData.get("priority") as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM";
  const contextId = formData.get("contextId") as string;
  const dueDate = formData.get("dueDate") as string;
  const waitDays = formData.get("waitDays")
    ? parseInt(formData.get("waitDays") as string)
    : null;
  const type =
    (formData.get("type") as "TASK" | "HABIT" | "RECURRING") || "TASK";
  const habitType = formData.get("habitType") as
    | "STREAK"
    | "LEARNING"
    | "WELLNESS"
    | "MAINTENANCE";
  const frequency = formData.get("frequency")
    ? parseInt(formData.get("frequency") as string)
    : null;
  const tagsString = formData.get("tags") as string;
  const notes = formData.get("notes") as string;
  const subtasksString = formData.get("subtasks") as string;

  if (!taskId || !title || !contextId) {
    throw new Error("Task ID, title and context are required");
  }

  // Verify task belongs to user
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existingTask) {
    throw new Error("Task not found");
  }

  // Verify context belongs to user
  const context = await prisma.context.findFirst({
    where: { id: contextId, userId },
  });

  if (!context) {
    throw new Error("Context not found");
  }

  const tags = parseTags(tagsString || "");

  // Parse subtasks JSON
  let subtasks = [];
  if (subtasksString) {
    try {
      subtasks = JSON.parse(subtasksString);
    } catch {
      // If parsing fails, default to empty array
      subtasks = [];
    }
  }

  // Calculate urgency
  const urgency = calculateUrgency({
    priority,
    dueDate: dueDate ? new Date(dueDate) : null,
    waitDays,
    createdAt: existingTask.createdAt,
    tags,
    contextCoefficient: context.coefficient || 0,
  });

  // Prepare update data based on type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    title,
    priority,
    tags,
    contextId,
    dueDate: dueDate ? new Date(dueDate) : null,
    waitDays,
    urgency,
    type,
    notes: notes || null,
    subtasks: subtasks,
    // Clear type-specific fields first
    habitType: null,
    frequency: null,
    nextDue: null,
  };

  // Set type-specific fields
  if (type === "HABIT") {
    updateData.habitType = habitType;
    updateData.frequency = frequency;
  } else if (type === "RECURRING") {
    updateData.frequency = frequency;
    if (dueDate) {
      updateData.nextDue = new Date(dueDate);
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  revalidatePath("/tasks");
}

// Server action to create a new context
export async function createContextAction(formData: FormData) {
  const userId = await getAuthenticatedUser();

  // Feature gating: Check if user has reached the maximum number of contexts
  const contextCount = await prisma.context.count({
    where: { userId },
  });

  if (contextCount >= FEATURE_LIMITS.MAX_CONTEXTS) {
    throw new Error(FEATURE_LIMIT_ERRORS.MAX_CONTEXTS);
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = (formData.get("icon") as string) || "Home";
  const color = (formData.get("color") as string) || "bg-gray-500";
  const coefficient = parseFloat(formData.get("coefficient") as string) || 0.0;

  if (!name) {
    throw new Error("Name is required");
  }

  // Create context
  await prisma.context.create({
    data: {
      name,
      description: description || null,
      icon,
      color,
      coefficient,
      userId,
    },
  });

  revalidatePath("/tasks");
}

// Server action to update an existing context
export async function updateContextAction(formData: FormData) {
  const userId = await getAuthenticatedUser();

  const contextId = formData.get("contextId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = (formData.get("icon") as string) || "Home";
  const color = (formData.get("color") as string) || "bg-gray-500";
  const coefficient = parseFloat(formData.get("coefficient") as string) || 0.0;

  if (!contextId || !name) {
    throw new Error("Context ID and name are required");
  }

  // Verify context belongs to user
  const existingContext = await prisma.context.findFirst({
    where: { id: contextId, userId },
  });

  if (!existingContext) {
    throw new Error("Context not found");
  }

  // Prevent modifying inbox contexts
  if (existingContext.isInbox) {
    throw new Error("Inbox context cannot be modified");
  }

  await prisma.context.update({
    where: { id: contextId },
    data: {
      name,
      description: description || null,
      icon,
      color,
      coefficient,
    },
  });

  revalidatePath("/tasks");
}

// Server action to delete a task
export async function deleteTaskAction(taskId: string) {
  const userId = await getAuthenticatedUser();

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath("/tasks");
  revalidatePath("/tasks/completed");
}

// Sign out action
export async function signOutAction() {
  redirect("/api/auth/signout");
}

// Get all existing tags for autocomplete
export async function getExistingTags(): Promise<string[]> {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    return [];
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      select: { tags: true },
    });

    const allTags = new Set<string>();
    tasks.forEach((task: { tags: string[] }) => {
      task.tags.forEach((tag) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  } catch (error) {
    console.error("Error fetching existing tags:", error);
    return [];
  }
}

// Archive context action
export async function archiveContextAction(contextId: string) {
  const userId = await getAuthenticatedUser();

  // Verify context belongs to user
  const existingContext = await prisma.context.findFirst({
    where: { id: contextId, userId },
  });

  if (!existingContext) {
    throw new Error("Context not found");
  }

  // Prevent archiving inbox contexts
  if (existingContext.isInbox) {
    throw new Error("Inbox context cannot be archived");
  }

  // Handle tasks in the context before archiving
  const tasks = await prisma.task.findMany({
    where: { contextId },
  });

  // Delete incomplete tasks, keep completed tasks
  const incompleteTasks = tasks.filter(
    (task: { completed: boolean }) => !task.completed,
  );
  if (incompleteTasks.length > 0) {
    await prisma.task.deleteMany({
      where: {
        id: { in: incompleteTasks.map((task: { id: string }) => task.id) },
      },
    });
  }

  // Archive the context
  await prisma.context.update({
    where: { id: contextId },
    data: { archived: true },
  });

  revalidatePath("/tasks");
}

// Server action to create a new tag
export async function createTagAction(formData: FormData) {
  const userId = await getAuthenticatedUser();

  const name = formData.get("name") as string;
  const coefficient = parseFloat(formData.get("coefficient") as string) || 0.0;
  const color = (formData.get("color") as string) || "bg-gray-500";

  if (!name) {
    throw new Error("Name is required");
  }

  // Check if tag already exists for this user
  const existingTag = await prisma.tag.findFirst({
    where: { name: name.toLowerCase(), userId },
  });

  if (existingTag) {
    throw new Error("Tag with this name already exists");
  }

  // Create tag
  await prisma.tag.create({
    data: {
      name: name.toLowerCase(),
      coefficient,
      color,
      userId,
    },
  });

  revalidatePath("/tasks");
}

// Server action to update an existing tag
export async function updateTagAction(formData: FormData) {
  const userId = await getAuthenticatedUser();

  const tagId = formData.get("tagId") as string;
  const name = formData.get("name") as string;
  const coefficient = parseFloat(formData.get("coefficient") as string) || 0.0;
  const color = (formData.get("color") as string) || "bg-gray-500";

  if (!tagId || !name) {
    throw new Error("Tag ID and name are required");
  }

  // Verify tag belongs to user
  const existingTag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });

  if (!existingTag) {
    throw new Error("Tag not found");
  }

  // Check if name conflicts with another tag
  const conflictingTag = await prisma.tag.findFirst({
    where: {
      name: name.toLowerCase(),
      userId,
      id: { not: tagId },
    },
  });

  if (conflictingTag) {
    throw new Error("Tag with this name already exists");
  }

  await prisma.tag.update({
    where: { id: tagId },
    data: {
      name: name.toLowerCase(),
      coefficient,
      color,
    },
  });

  revalidatePath("/tasks");
}

// Server action to delete a tag
export async function deleteTagAction(tagId: string) {
  const userId = await getAuthenticatedUser();

  // Verify tag belongs to user
  const existingTag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });

  if (!existingTag) {
    throw new Error("Tag not found");
  }

  // Delete the tag (TaskTag relations will be deleted automatically via cascade)
  await prisma.tag.delete({
    where: { id: tagId },
  });

  revalidatePath("/tasks");
}

// Unarchive context action
export async function unarchiveContextAction(contextId: string) {
  const userId = await getAuthenticatedUser();

  // Verify context belongs to user
  const existingContext = await prisma.context.findFirst({
    where: { id: contextId, userId, archived: true },
  });

  if (!existingContext) {
    throw new Error("Archived context not found");
  }

  // Unarchive the context
  await prisma.context.update({
    where: { id: contextId },
    data: { archived: false },
  });

  revalidatePath("/tasks");
}

// Update user name action
export async function updateUserNameAction(name: string) {
  const userId = await getAuthenticatedUser();

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error("Name cannot be empty");
  }

  // Update user name
  await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  });

  // Revalidate all pages that might display the user name
  revalidatePath("/", "layout");
}

// Change password action
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
) {
  const userId = await getAuthenticatedUser();

  // Validate inputs using Zod schema
  const { changePasswordSchema } = await import("./validation");
  const result = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
  });

  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new Error(firstError.message);
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user || !user.password) {
    throw new Error("User not found or no password set");
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
