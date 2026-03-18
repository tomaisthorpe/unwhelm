"use client";

import { useState, useEffect } from "react";
import { TodaySection } from "@/components/today-section";
import { ContextsSection } from "@/components/contexts-section";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import type { Task } from "@/lib/data";

const COLLAPSED_STATE_KEY = "unwhelm-kiosk-collapsed-contexts";

function loadCollapsedState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(COLLAPSED_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveCollapsedState(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSED_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function KioskDashboard() {
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>(
    () => loadCollapsedState(),
  );

  const { tasks, contexts, archivedContexts, tags, isLoading, isError, mutate } =
    useDashboardData();

  useEffect(() => {
    saveCollapsedState(collapsedState);
  }, [collapsedState]);

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

  const sortedContexts = [...contexts].sort((a, b) => {
    const aHabits = tasks.filter(
      (task: Task) => task.contextId === a.id && task.type === "HABIT",
    );
    const bHabits = tasks.filter(
      (task: Task) => task.contextId === b.id && task.type === "HABIT",
    );

    const aHealth =
      aHabits.length === 0
        ? 100
        : Math.round(
            (aHabits.filter((h: Task) => h.completed).length / aHabits.length) * 100,
          );
    const bHealth =
      bHabits.length === 0
        ? 100
        : Math.round(
            (bHabits.filter((h: Task) => h.completed).length / bHabits.length) * 100,
          );

    if (aHealth !== bHealth) return aHealth - bHealth;

    const aMaxUrgency = Math.max(
      ...tasks
        .filter((task: Task) => task.contextId === a.id)
        .map((task: Task) => task.urgency),
      0,
    );
    const bMaxUrgency = Math.max(
      ...tasks
        .filter((task: Task) => task.contextId === b.id)
        .map((task: Task) => task.urgency),
      0,
    );

    return bMaxUrgency - aMaxUrgency;
  });

  const allContexts = [...contexts, ...archivedContexts];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <TodaySection
        tasks={tasks}
        contexts={allContexts}
        tags={tags}
        onDataChange={mutate}
        readOnly={true}
      />

      <ContextsSection
        contexts={sortedContexts}
        tasks={tasks}
        tags={tags}
        collapsedState={collapsedState}
        onCollapsedStateChange={setCollapsedState}
        archivedContexts={archivedContexts}
        onDataChange={mutate}
        readOnly={true}
        hideSearch={true}
        defaultCollapsed={true}
      />
    </div>
  );
}
