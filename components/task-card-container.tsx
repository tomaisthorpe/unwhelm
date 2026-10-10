"use client";

import { useState, useTransition } from "react";
import { useDashboardActions } from "@/lib/hooks/use-dashboard-actions";
import { setTaskPlannedTodayAction } from "@/lib/server-actions";
import { TaskCard } from "./task-card";
import type { Task, Tag } from "@/lib/data";

interface TaskCardContainerProps {
  task: Task;
  contexts: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    coefficient: number;
    isInbox: boolean;
  }>;
  tags?: Tag[];
  showContext?: boolean;
  onContextClick?: (contextId: string) => void;
  showUrgency?: boolean;
  searchQuery?: string;
  onTagClick?: (tag: string) => void;
  onDataChange?: () => void;
}

export function TaskCardContainer({
  task,
  contexts,
  tags,
  showContext,
  onContextClick,
  showUrgency,
  searchQuery,
  onTagClick,
  onDataChange,
}: TaskCardContainerProps) {
  const [isPending, startTransition] = useTransition();
  const [isPlanPending, startPlanTransition] = useTransition();
  const [planError, setPlanError] = useState<string | null>(null);
  const { toggleTask } = useDashboardActions();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTask(task.id);
      onDataChange?.();
    });
  };

  const handlePlanToggle = () => {
    setPlanError(null);
    startPlanTransition(async () => {
      try {
        await setTaskPlannedTodayAction(task.id, !task.isPlannedToday);
        await onDataChange?.();
      } catch (error) {
        setPlanError(
          error instanceof Error ? error.message : "Could not update Today",
        );
      }
    });
  };

  return (
    <TaskCard
      task={task}
      contexts={contexts}
      tags={tags}
      showContext={showContext}
      onContextClick={onContextClick}
      showUrgency={showUrgency}
      searchQuery={searchQuery}
      onTagClick={onTagClick}
      onDataChange={onDataChange}
      onToggle={handleToggle}
      isTogglePending={isPending}
      onPlanToggle={handlePlanToggle}
      isPlanPending={isPlanPending}
      planError={planError}
    />
  );
}
