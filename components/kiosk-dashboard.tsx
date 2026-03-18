"use client";

import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { TaskCard } from "@/components/task-card";
import { shouldHideCompletedTask, shouldHabitShowAsAvailable } from "@/lib/utils";
import type { Task } from "@/lib/data";

function isEffectivelyCompleted(task: Task): boolean {
  if (task.type === "HABIT") {
    return task.completed && !shouldHabitShowAsAvailable(task);
  }
  return task.completed;
}

export function KioskDashboard() {
  const { tasks, contexts, archivedContexts, tags, isLoading, mutate } = useDashboardData();

  const allContexts = [...contexts, ...archivedContexts];

  const sorted = [...tasks]
    .filter((t) => !shouldHideCompletedTask(t))
    .sort((a, b) => {
      const aDone = isEffectivelyCompleted(a);
      const bDone = isEffectivelyCompleted(b);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return b.urgency - a.urgency;
    });

  if (isLoading && tasks.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-sm text-center pt-12">Loading…</div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm text-center pt-12">No tasks</div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-2 py-2 space-y-1">
      {sorted.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          contexts={allContexts}
          tags={tags}
          showContext={true}
          showUrgency={true}
          onDataChange={mutate}
        />
      ))}
    </div>
  );
}
