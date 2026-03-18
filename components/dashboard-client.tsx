"use client";

import { useState, useEffect } from "react";
import { TodaySection } from "@/components/today-section";
import { AddItemModal } from "@/components/add-item-modal";
import { SmartTaskInput } from "@/components/smart-task-input";
import { ContextsSection } from "@/components/contexts-section";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { usePWABadge } from "@/lib/hooks/use-pwa-badge";
import { BadgePermissionBanner } from "@/components/badge-permission-banner";
import { countDueAndOverdueTasks } from "@/lib/badge-utils";

const COLLAPSED_STATE_KEY = "unwhelm-collapsed-contexts";

function loadCollapsedState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(COLLAPSED_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Failed to load collapsed state from localStorage:", error);
    return {};
  }
}

function saveCollapsedState(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSED_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save collapsed state to localStorage:", error);
  }
}

export function DashboardClient() {
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>(
    () => loadCollapsedState(),
  );

  // Use SWR hook for client-side data fetching
  const {
    tasks,
    contexts,
    archivedContexts,
    tags,
    isLoading,
    isError,
    mutate,
  } = useDashboardData();

  // Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    saveCollapsedState(collapsedState);
  }, [collapsedState]);

  // Update PWA badge based on task data
  const { requestPermission, permissionState } = usePWABadge(tasks);

  // Calculate due task count for the permission banner
  const dueTaskCount = countDueAndOverdueTasks(tasks);

  const scrollToContext = (contextId: string) => {
    // First, ensure the context is expanded
    setCollapsedState((prev) => ({
      ...prev,
      [contextId]: false,
    }));

    // Small delay to ensure the DOM has updated before scrolling
    setTimeout(() => {
      const element = document.getElementById(`context-${contextId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Add a brief highlight effect
        element.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.5)";
        setTimeout(() => {
          element.style.boxShadow = "";
        }, 2000);
      }
    }, 100);
  };

  // Loading state
  if (isLoading && tasks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-600 dark:text-red-400">
            Failed to load dashboard data. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // Sort contexts by health (lowest first), then by highest urgency task
  // This sorting is stable and only calculated on server-side load/reload
  const sortedContexts = [...contexts].sort((a, b) => {
    // Calculate health for each context (server-side snapshot)
    const aHabits = tasks.filter(
      (task) => task.contextId === a.id && task.type === "HABIT",
    );
    const bHabits = tasks.filter(
      (task) => task.contextId === b.id && task.type === "HABIT",
    );

    const aHealth =
      aHabits.length === 0
        ? 100
        : Math.round(
            (aHabits.filter((h) => h.completed).length / aHabits.length) * 100,
          );
    const bHealth =
      bHabits.length === 0
        ? 100
        : Math.round(
            (bHabits.filter((h) => h.completed).length / bHabits.length) * 100,
          );

    // Sort by health (lowest first)
    if (aHealth !== bHealth) {
      return aHealth - bHealth;
    }

    // If health is equal, sort by highest urgency task in context
    const aMaxUrgency = Math.max(
      ...tasks
        .filter((task) => task.contextId === a.id)
        .map((task) => task.urgency),
      0,
    );
    const bMaxUrgency = Math.max(
      ...tasks
        .filter((task) => task.contextId === b.id)
        .map((task) => task.urgency),
      0,
    );

    return bMaxUrgency - aMaxUrgency;
  });

  // Combine active and archived contexts for task badge display
  const allContexts = [...contexts, ...archivedContexts];

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Smart Task Input */}
        <SmartTaskInput contexts={contexts} />

        {/* Badge Permission Banner */}
        <BadgePermissionBanner
          permissionState={permissionState}
          onRequestPermission={requestPermission}
          taskCount={dueTaskCount}
        />

        {/* Today Section */}
        <TodaySection
          tasks={tasks}
          contexts={allContexts}
          tags={tags}
          onContextClick={scrollToContext}
          onDataChange={mutate}
        />

        {/* Context Groups */}
        <ContextsSection
          contexts={sortedContexts}
          tasks={tasks}
          tags={tags}
          collapsedState={collapsedState}
          onCollapsedStateChange={setCollapsedState}
          archivedContexts={archivedContexts}
          onDataChange={mutate}
        />
      </div>
      <div className="flex justify-center mt-2 pb-16">
        <AddItemModal contexts={contexts} tags={tags} onDataChange={mutate} />
      </div>
    </>
  );
}

