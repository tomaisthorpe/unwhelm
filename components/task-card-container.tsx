"use client";

import { useTransition } from "react";
import { useDashboardActions } from "@/lib/hooks/use-dashboard-actions";
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
  onDataChange,
}: TaskCardContainerProps) {
  const [isPending, startTransition] = useTransition();
  const { toggleTask } = useDashboardActions();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTask(task.id);
      onDataChange?.();
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
      onDataChange={onDataChange}
      onToggle={handleToggle}
      isTogglePending={isPending}
    />
  );
}
