/**
 * Utility functions for PWA badge management
 */

import { Task } from "@/lib/data";
import { diffInCalendarDays } from "@/lib/date-utils";
import { shouldHideCompletedTask, shouldHabitShowAsAvailable } from "@/lib/utils";

type DueTask = Pick<
  Task,
  "completed" | "completedAt" | "dueDate" | "type"
>;

export type DueAndOverdueTaskCounts = {
  dueToday: number;
  overdue: number;
  total: number;
};

/**
 * Counts due and overdue tasks separately.
 */
export function getDueAndOverdueTaskCounts(
  tasks: DueTask[],
  now: Date = new Date(),
  timeZone?: string
): DueAndOverdueTaskCounts {
  let dueToday = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (shouldHideCompletedTask(task)) continue;

    if (task.type === "HABIT") {
      const effectivelyCompleted =
        task.completed && !shouldHabitShowAsAvailable(task);
      if (effectivelyCompleted) continue;
    } else if (task.completed) {
      continue;
    }

    if (!task.dueDate) continue;

    const diffDays = diffInCalendarDays(task.dueDate, now, timeZone);
    if (diffDays === 0) dueToday += 1;
    if (diffDays < 0) overdue += 1;
  }

  return { dueToday, overdue, total: dueToday + overdue };
}

/**
 * Counts tasks that are due today or overdue and not completed
 */
export function countDueAndOverdueTasks(tasks: Task[]): number {
  return getDueAndOverdueTaskCounts(tasks).total;
}

// Extend Navigator interface to include Badge API
declare global {
  interface Navigator {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

/**
 * Permission states for badge functionality
 */
export type BadgePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Checks if Badge API is supported
 */
export function isBadgeAPISupported(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Requests permission to use the Badge API (required for iOS)
 */
export async function requestBadgePermission(): Promise<BadgePermissionState> {
  if (!isBadgeAPISupported()) {
    return 'unsupported';
  }

  try {
    // For iOS, we need to request permission explicitly
    // The Badge API permission is tied to notifications permission on iOS
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      switch (permission) {
        case 'granted':
          return 'granted';
        case 'denied':
          return 'denied';
        default:
          return 'prompt';
      }
    }
    
    // For other platforms, assume granted if API is available
    return 'granted';
  } catch (error) {
    console.warn('Failed to request badge permission:', error);
    return 'denied';
  }
}

/**
 * Gets the current badge permission state
 */
export function getBadgePermissionState(): BadgePermissionState {
  if (!isBadgeAPISupported()) {
    return 'unsupported';
  }

  if ('Notification' in window) {
    switch (Notification.permission) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'prompt';
    }
  }

  // For platforms without notification permission, assume granted if API is available
  return 'granted';
}

/**
 * Updates the PWA badge with the given count
 */
export async function updatePWABadge(count: number): Promise<boolean> {
  const permissionState = getBadgePermissionState();
  
  // Don't attempt to update if unsupported or denied
  if (permissionState === 'unsupported' || permissionState === 'denied') {
    return false;
  }

  // Check if the Badge API is supported and we have permission
  if (navigator.setAppBadge && permissionState === 'granted') {
    try {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        // Clear the badge when count is 0
        await navigator.clearAppBadge?.();
      }
      return true;
    } catch (error) {
      console.warn('Failed to update PWA badge:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Clears the PWA badge
 */
export async function clearPWABadge(): Promise<void> {
  if (navigator.clearAppBadge) {
    try {
      await navigator.clearAppBadge();
    } catch (error) {
      console.warn('Failed to clear PWA badge:', error);
    }
  }
}
