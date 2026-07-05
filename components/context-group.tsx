"use client";

import { ReactNode } from "react";
import { TaskCard } from "./task-card";
import { TaskCardContainer } from "./task-card-container";
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
  onTagClick?: (tag: string) => void;
  onDataChange?: () => void;
  readOnly?: boolean;
  onEditContext?: () => void;
  addTaskNode?: ReactNode;
}

function getContextCompletion(tasks: Task[]) {
  const contextHabits = tasks.filter((task) => task.type === "HABIT");
  if (contextHabits.length === 0) {
    return { percentage: 100, completed: 0, total: 0 };
  }
  const completed = contextHabits.filter((task) => task.completed).length;
  const total = contextHabits.length;
  return { percentage: Math.round((completed / total) * 100), completed, total };
}

function ContextGroupHeader({
  context,
  completion,
  todayTasksInContext,
  hasHabits,
  searchQuery,
  onEditContext,
  addTaskNode,
}: {
  context: Context;
  completion: { percentage: number; completed: number; total: number };
  todayTasksInContext: number;
  hasHabits: boolean;
  searchQuery?: string;
  onEditContext?: () => void;
  addTaskNode?: ReactNode;
}) {
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
              <div
                className="ml-3 flex flex-wrap justify-end items-center gap-2 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {onEditContext && !context.isInbox && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditContext();
                    }}
                    className="flex items-center space-x-2 px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                    title="Edit context"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
                {addTaskNode}
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
  onTagClick,
  onDataChange,
  readOnly,
  onEditContext,
  addTaskNode,
}: ContextGroupProps) {
  const contextTasks = tasks
    .filter((task) => {
      if (task.contextId !== context.id) return false;
      if (shouldHideCompletedTask(task)) return false;
      return true;
    })
    .sort((a, b) => {
      const aEffectivelyCompleted =
        a.type === "HABIT" ? a.completed && !shouldHabitShowAsAvailable(a) : a.completed;
      const bEffectivelyCompleted =
        b.type === "HABIT" ? b.completed && !shouldHabitShowAsAvailable(b) : b.completed;
      if (aEffectivelyCompleted !== bEffectivelyCompleted)
        return aEffectivelyCompleted ? 1 : -1;
      return b.urgency - a.urgency;
    });

  const completion = getContextCompletion(contextTasks);
  const hasHabits = completion.total > 0;

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
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden"
    >
      <ContextCollapsible
        defaultCollapsed={contextTasks.length === 0}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      >
        <ContextGroupHeader
          context={context}
          completion={completion}
          todayTasksInContext={todayTasksInContext}
          hasHabits={hasHabits}
          searchQuery={searchQuery}
          onEditContext={onEditContext}
          addTaskNode={addTaskNode}
        />
        <ContextCollapsibleContent>
          <div className="p-2 md:p-4">
            {contextTasks.length > 0 ? (
              <div className="space-y-1">
                {contextTasks.map((task) =>
                  readOnly ? (
                    <TaskCard
                      key={task.id}
                      task={task}
                      contexts={allContexts}
                      tags={tags}
                      searchQuery={searchQuery}
                      onTagClick={onTagClick}
                      readOnly
                    />
                  ) : (
                    <TaskCardContainer
                      key={task.id}
                      task={task}
                      contexts={allContexts}
                      tags={tags}
                      searchQuery={searchQuery}
                      onTagClick={onTagClick}
                      onDataChange={onDataChange}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No tasks in this context
              </p>
            )}
          </div>
        </ContextCollapsibleContent>
      </ContextCollapsible>
    </div>
  );
}
