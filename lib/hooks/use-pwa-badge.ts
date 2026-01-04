import { useEffect, useCallback, useState } from 'react';
import { Task } from '@/lib/data';
import { 
  countDueAndOverdueTasks, 
  updatePWABadge, 
  requestBadgePermission, 
  getBadgePermissionState,
  BadgePermissionState 
} from '@/lib/badge-utils';

/**
 * Hook to automatically update PWA badge based on tasks
 */
export function usePWABadge(tasks: Task[]) {
  // Initialize permission state with current value
  const [permissionState, setPermissionState] = useState<BadgePermissionState>(() =>
    getBadgePermissionState()
  );

  // Function to manually update badge
  const updateBadge = useCallback(async () => {
    const badgeCount = countDueAndOverdueTasks(tasks);
    const success = await updatePWABadge(badgeCount);
    return success;
  }, [tasks]);

  // Function to request badge permission
  const requestPermission = useCallback(async () => {
    const permission = await requestBadgePermission();
    setPermissionState(permission);
    return permission;
  }, []);

  // Update badge when tasks change (only if we have permission)
  useEffect(() => {
    // Only update badge if we have tasks data and permission
    if (tasks.length === 0 || permissionState !== 'granted') return;
    
    updateBadge();
  }, [tasks, updateBadge, permissionState]);

  // Update badge when page becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && tasks.length > 0 && permissionState === 'granted') {
        updateBadge();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateBadge, tasks, permissionState]);

  // Update badge when the app gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (tasks.length > 0 && permissionState === 'granted') {
        updateBadge();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [updateBadge, tasks, permissionState]);

  // Periodic badge update (every 5 minutes) to handle time-based changes
  // (e.g., tasks becoming overdue)
  useEffect(() => {
    if (tasks.length === 0 || permissionState !== 'granted') return;

    const interval = setInterval(() => {
      updateBadge();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [updateBadge, tasks, permissionState]);

  return { 
    updateBadge, 
    requestPermission, 
    permissionState,
    canUseBadge: permissionState === 'granted'
  };
}