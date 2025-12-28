"use client";

import React, { useState } from "react";
import { TaskCard } from "./task-card";
import { AddItemModal } from "./add-item-modal";
import { TaskModal } from "./add-item-modal";
import {
  cn,
  shouldHideCompletedTask,
  shouldHabitShowAsAvailable,
} from "@/lib/utils";
import { ChevronDown, Pencil } from "lucide-react";
import {
  ContextCollapsible,
  ContextCollapsibleContent,
  ContextCollapsibleTrigger,
  useCollapsible,
} from "./context-collapsible";
import type { Task, Context, Tag } from "@/lib/data";
import { ContextIcon } from "@/lib/context-icons";
import { HighlightedText } from "@/components/ui/highlighted-text";

interface ContextGroupProps {
  context: Context;
  tasks: Task[];
  allContexts: Context[];
  tags: Tag[];
  collapsed?: boolean;
  onCollapsedChange?: (value: boolean) => void;
  searchQuery?: string;
  onDataChange?: () => void;
}

function getContextCompletion(tasks: Task[]) {
  // Only habits contribute to context health, not one-off tasks
  const contextHabits = tasks.filter((task) => task.type === "HABIT");
  if (contextHabits.length === 0) {
    return { percentage: 100, completed: 0, total: 0 };
  }

  const completed = contextHabits.filter((task) => task.completed).length;
  const total = contextHabits.length;
  const percentage = Math.round((completed / total) * 100);

  return { percentage, completed, total };
}

// Inner component to access the collapsed state
function ContextGroupHeader({
  context,
  allContexts,
  tags,
  completion,
  todayTasksInContext,
  hasHabits,
  searchQuery,
  onDataChange,
}: {
  context: Context;
  allContexts: Context[];
  tags: Tag[];
  completion: { percentage: number; completed: number; total: number };
  todayTasksInContext: number;
  hasHabits: boolean;
  searchQuery?: string;
  onDataChange?: () => void;
}) {
  const [isEditContextOpen, setIsEditContextOpen] = useState(false);
  const { isCollapsed } = useCollapsible();

  return (
    <div className={cn("py-2 px-4 text-white", context.color)}>
      <ContextCollapsibleTrigger>
        <div className="w-full flex items-center justify-between rounded-lg p-2 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
              <ContextIcon iconName={context.icon} className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">
                <HighlightedText text={context.name} searchQuery={searchQuery} />
              </h3>
              {context.description && (
                <p className="text-sm opacity-90">
                  <HighlightedText text={context.description} searchQuery={searchQuery} />
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end gap-1">
              <div className="ml-3 flex flex-wrap justify-end items-center gap-2 flex-shrink-0">
                {!context.isInbox && (
                  <button
                    onClick={() => setIsEditContextOpen(true)}
                    className="flex items-center space-x-2 px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                    title="Edit context"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
                <AddItemModal
                  contexts={allContexts}
                  tags={tags}
                  defaultContextId={context.id}
                  addButtonSize="sm"
                  onDataChange={onDataChange}
                />
              </div>
              {todayTasksInContext > 0 && (
                <p className="text-xs opacity-90">
                  {todayTasksInContext} tasks due
                </p>
              )}
            </div>
          </div>
        </div>
      </ContextCollapsibleTrigger>

      {hasHabits && (
        <div className="mt-1 flex items-center justify-between">
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          <p className="text-xs opacity-90 ml-2 whitespace-nowrap flex-shrink-0">
            {completion.completed}/{completion.total} habits
          </p>
        </div>
      )}

      <TaskModal
        contexts={allContexts}
        tags={tags}
        contextToEdit={context}
        isOpen={isEditContextOpen}
        onClose={() => setIsEditContextOpen(false)}
        onDataChange={onDataChange}
      />
    </div>
  );
}

export function ContextGroup({
  context,
  tasks,
  allContexts,
  tags,
  collapsed,
  onCollapsedChange,
  searchQuery,
  onDataChange,
}: ContextGroupProps) {
  const contextTasks = tasks
    .filter((task) => {
      // Only include tasks in this context
      if (task.contextId !== context.id) return false;

      // Hide completed tasks from previous days (except if completed within the last hour)
      if (shouldHideCompletedTask(task)) return false;

      return true;
    })
    .sort((a, b) => {
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

  const completion = getContextCompletion(contextTasks);
  const hasHabits = completion.total > 0;

  // Count tasks scheduled for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasksInContext = contextTasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() <= today.getTime();
  }).length;

  return (
    <div
      id={`context-${context.id}`}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <ContextCollapsible
        defaultCollapsed={contextTasks.length === 0}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      >
        <ContextGroupHeader
          context={context}
          allContexts={allContexts}
          tags={tags}
          completion={completion}
          todayTasksInContext={todayTasksInContext}
          hasHabits={hasHabits}
          searchQuery={searchQuery}
          onDataChange={onDataChange}
        />
        <ContextCollapsibleContent>
          <div className="p-2 md:p-4">
            {contextTasks.length > 0 ? (
              <div className="space-y-1">
                {contextTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    contexts={allContexts}
                    tags={tags}
                    searchQuery={searchQuery}
                    onDataChange={onDataChange}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No tasks in this context
              </p>
            )}
          </div>
        </ContextCollapsibleContent>
      </ContextCollapsible>
    </div>
  );
}
