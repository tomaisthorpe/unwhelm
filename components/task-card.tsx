"use client";

import { useState } from "react";
import {
  RotateCcw,
  Dumbbell,
  BookOpen,
  Flame,
  Wrench,
  FileText,
  CheckSquare,
  Circle,
  CheckCircle2,
} from "lucide-react";
import {
  formatDateForTask,
  evaluateUrgency,
  getUrgencyColor,
  shouldHabitShowAsAvailable,
} from "@/lib/utils";
import { getHabitStatus, getHabitDisplay } from "@/lib/habits";
import { ContextIcon } from "@/lib/context-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskModal } from "./add-item-modal";
import { MarkdownText } from "@/components/ui/markdown-text";
import { HighlightedText } from "@/components/ui/highlighted-text";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task, Tag as TagType } from "@/lib/data";

interface TaskCardProps {
  task: Task;
  contexts: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    coefficient: number;
    isInbox: boolean;
  }>;
  tags?: TagType[];
  showContext?: boolean;
  onContextClick?: (contextId: string) => void;
  showUrgency?: boolean;
  searchQuery?: string;
  onTagClick?: (tag: string) => void;
  onDataChange?: () => void;
  readOnly?: boolean;
  onToggle?: () => void;
  isTogglePending?: boolean;
}

const renderHabitIcon = (iconType: string, className: string) => {
  switch (iconType) {
    case "dumbbell":
      return <Dumbbell className={className} />;
    case "book":
      return <BookOpen className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "wrench":
      return <Wrench className={className} />;
    default:
      return <Flame className={className} />;
  }
};

// Helper function to render compact subtask display
const renderSubtaskDisplay = (
  subtasks: Array<{ id: string; text: string; completed: boolean }>,
) => {
  if (!subtasks || subtasks.length === 0) return null;

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
          <CheckSquare className="w-3 h-3" />
          <span>
            {completedCount}/{totalCount}
          </span>
          {totalCount > 0 && (
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs max-w-xs">
          <div className="font-medium mb-1">
            Subtasks ({completedCount}/{totalCount})
          </div>
          {subtasks.slice(0, 5).map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center space-x-1 py-0.5"
            >
              <span
                className={
                  subtask.completed ? "text-green-500" : "text-gray-400"
                }
              >
                {subtask.completed ? "✓" : "○"}
              </span>
              <span
                className={
                  subtask.completed ? "line-through text-gray-400" : ""
                }
              >
                <MarkdownText
                  text={
                    subtask.text.length > 30
                      ? `${subtask.text.substring(0, 30)}...`
                      : subtask.text
                  }
                />
              </span>
            </div>
          ))}
          {subtasks.length > 5 && (
            <div className="text-gray-400 text-center pt-1">
              ... and {subtasks.length - 5} more
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export function TaskCard({
  task,
  contexts,
  tags = [],
  showContext = false,
  showUrgency = true,
  onContextClick,
  searchQuery,
  onTagClick,
  onDataChange,
  readOnly,
  onToggle,
  isTogglePending,
}: TaskCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dateInfo = formatDateForTask(task.dueDate);
  const habitStatus =
    task.type === "HABIT"
      ? getHabitStatus({
          completedAt: task.completedAt,
          frequency: task.frequency,
        })
      : null;
  const habitDisplay = getHabitDisplay(task);

  // For habits, calculate whether they should show as available (uncompleted) or completed
  const effectiveCompleted =
    task.type === "HABIT"
      ? !shouldHabitShowAsAvailable({
          completed: task.completed,
          completedAt: task.completedAt,
          type: task.type,
        })
      : task.completed;

  // Find the context for this task to get its coefficient
  const taskContext = contexts.find((ctx) => ctx.id === task.contextId);

  // Build tag coefficients map
  const tagCoefficients: { [tagName: string]: number } = {};
  tags.forEach((tag) => {
    tagCoefficients[tag.name.toLowerCase()] = tag.coefficient;
  });

  const urgencyExplanation = evaluateUrgency({
    priority: task.priority,
    dueDate: task.dueDate,
    waitDays: task.waitDays,
    createdAt: task.createdAt,
    tags: task.tags,
    contextCoefficient: taskContext?.coefficient || 0,
    tagCoefficients,
  });

  return (
    <TooltipProvider>
      <div className="flex items-start space-x-3 py-2 sm:px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          disabled={isTogglePending || !onToggle}
          className="mt-0.5 py-0.5 px-0 h-auto hover:bg-transparent"
        >
          {effectiveCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className={cn("flex-1", effectiveCompleted && "opacity-60")}>
              <div className="flex items-center flex-wrap space-x-2">
                <h3
                  className={cn(
                    "font-normal text-base transition-colors",
                    !readOnly && "cursor-pointer hover:text-blue-600",
                    effectiveCompleted
                      ? "line-through text-gray-500"
                      : "text-gray-900 dark:text-gray-100",
                  )}
                  onClick={readOnly ? undefined : () => setIsEditModalOpen(true)}
                  title={readOnly ? undefined : "Click to edit task"}
                >
                  {searchQuery ? (
                    <HighlightedText
                      text={task.title}
                      searchQuery={searchQuery}
                    />
                  ) : (
                    <MarkdownText text={task.title} />
                  )}
                </h3>

                {task.type === "RECURRING" && (
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-600 font-medium">
                      Every {task.frequency}d
                    </span>
                  </div>
                )}

                {habitDisplay && (
                  <div className="flex items-center space-x-1">
                    {renderHabitIcon(
                      habitDisplay.iconType,
                      cn("w-3 h-3", habitDisplay.iconColor),
                    )}
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {habitDisplay.primaryText}
                    </span>
                    {habitDisplay.secondaryText && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {habitDisplay.secondaryText}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {((showContext && taskContext) ||
                task.tags.length > 0 ||
                task.notes ||
                task.priority !== "MEDIUM" ||
                (task.subtasks && task.subtasks.length > 0)) && (
                <div className="flex flex-wrap items-center space-x-2 md:space-x-3 mt-1">
                  {showContext &&
                    taskContext &&
                    (onContextClick ? (
                      <button
                        onClick={() => onContextClick(taskContext.id)}
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white transition-all hover:scale-105 hover:shadow-md mb-1",
                          taskContext.color,
                        )}
                        title={`Click to scroll to ${taskContext.name} context`}
                      >
                        <ContextIcon
                          iconName={taskContext.icon}
                          className="w-3 h-3 mr-1"
                        />
                        {taskContext.name}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white mb-1",
                          taskContext.color,
                        )}
                        title={taskContext.name}
                      >
                        <ContextIcon
                          iconName={taskContext.icon}
                          className="w-3 h-3 mr-1"
                        />
                        {taskContext.name}
                      </span>
                    ))}
                  {task.priority !== "MEDIUM" && (
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mb-1",
                        task.priority === "HIGH"
                          ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {task.priority === "HIGH" ? "↑ High" : "↓ Low"}
                    </span>
                  )}
                  {task.tags.map((tag) =>
                    onTagClick ? (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onTagClick(tag)}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 mb-1"
                        title={`Search for #${tag}`}
                      >
                        <HighlightedText
                          text={`#${tag}`}
                          searchQuery={searchQuery}
                        />
                      </button>
                    ) : (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 mb-1"
                      >
                        <HighlightedText
                          text={`#${tag}`}
                          searchQuery={searchQuery}
                        />
                      </span>
                    ),
                  )}
                  {task.notes && (
                    <Tooltip>
                      <TooltipTrigger>
                        <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400 mb-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          {searchQuery ? (
                            <HighlightedText
                              text={
                                task.notes.length > 100
                                  ? `${task.notes.substring(0, 100)}...`
                                  : task.notes
                              }
                              searchQuery={searchQuery}
                            />
                          ) : (
                            <MarkdownText
                              text={
                                task.notes.length > 100
                                  ? `${task.notes.substring(0, 100)}...`
                                  : task.notes
                              }
                            />
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {renderSubtaskDisplay(task.subtasks)}
                </div>
              )}
            </div>

            {showUrgency && (
              <div className="flex items-center ml-2 justify-end flex-wrap gap-2 max-w-1/2">
                {habitStatus && (
                  <div
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      habitStatus.color,
                    )}
                  >
                    {habitStatus.text}
                  </div>
                )}
                {dateInfo && (
                  <div
                    className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap",
                      dateInfo.color,
                    )}
                  >
                    {dateInfo.text}
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-semibold cursor-help",
                        getUrgencyColor(task.urgency),
                      )}
                    >
                      {task.urgency.toFixed(1)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs w-56">
                    <div className="text-xs space-y-1.5">
                      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide pb-0.5">
                        Urgency breakdown
                      </div>
                      {urgencyExplanation.explanation
                        .map((line) => {
                          const match = line.match(/^(.+):\s*([+-]?\d+\.?\d*)$/);
                          if (!match) return null;
                          const value = parseFloat(match[2]);
                          if (value === 0) return null;
                          return { label: match[1], value };
                        })
                        .filter((r): r is { label: string; value: number } => r !== null)
                        .map(({ label, value }) => (
                          <div key={label} className="flex justify-between gap-4">
                            <span className="text-gray-500 dark:text-gray-400">{label}</span>
                            <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
                              {value >= 0 ? "+" : ""}
                              {value.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      <div className="flex justify-between gap-4 pt-1 border-t border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {urgencyExplanation.score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {!readOnly && (
        <TaskModal
          contexts={contexts}
          tags={tags}
          task={task}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onDataChange={onDataChange}
        />
      )}
    </TooltipProvider>
  );
}
