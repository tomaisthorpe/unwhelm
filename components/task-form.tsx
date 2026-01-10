"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input";
import { SubtasksInput } from "@/components/ui/subtasks-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckSquare,
  RotateCcw,
  Dumbbell,
  BookOpen,
  Heart,
  Wrench,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { getContextIconComponent } from "@/lib/context-icons";

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskFormData {
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  contextId: string;
  dueDate: string;
  waitDays?: number;
  type: "TASK" | "HABIT" | "RECURRING";
  habitType?: "STREAK" | "LEARNING" | "WELLNESS" | "MAINTENANCE";
  frequency?: number;
  tags: string[];
  notes?: string;
  subtasks: Subtask[];
}

interface TaskFormProps {
  data: TaskFormData;
  onChange: <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ) => void;
  contexts: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    isInbox: boolean;
  }>;
  existingTags?: string[];
  errors?: Partial<Record<keyof TaskFormData, string>>;
  compact?: boolean;
  isEditing?: boolean;
  task?: {
    id: string;
    createdAt: Date;
  };
  fieldIdPrefix?: string;
  onTagEdit?: (tagName: string) => void;
}

export function TaskForm({
  data,
  onChange,
  contexts,
  existingTags = [],
  errors = {},
  compact = false,
  isEditing = false,
  task,
  fieldIdPrefix = "taskform",
  onTagEdit,
}: TaskFormProps) {
  const getFieldId = (fieldName: string) => `${fieldIdPrefix}-${fieldName}`;

  // State to control wait days input visibility
  // Initialize to true if wait days is already set
  const [showWaitDays, setShowWaitDays] = useState(
    data.waitDays !== undefined && data.waitDays > 0,
  );

  // State to control tooltip visibility for each wait days section
  const [tooltipOpen, setTooltipOpen] = useState<{
    task?: boolean;
    habit?: boolean;
    recurring?: boolean;
  }>({});

  const gridCols = "grid-cols-2";
  const gap = compact ? "gap-2" : "gap-4";
  const spacing = compact ? "space-y-2" : "space-y-4";

  // Find inbox context for default selection
  const inboxContext = contexts.find((c) => c.isInbox);

  // Get the selected context or default to inbox
  const selectedContextId = data.contextId || inboxContext?.id || "";
  const selectedContext = contexts.find((c) => c.id === selectedContextId);

  return (
    <div className={spacing}>
      <div className={`grid ${gridCols} ${gap}`}>
        {/* Title */}
        <div className={compact ? "" : "col-span-2"}>
          <Label
            htmlFor={getFieldId("title")}
            className={compact ? "text-xs" : ""}
          >
            Task Title {!compact && "*"}
          </Label>
          <Input
            id={getFieldId("title")}
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder={compact ? "Task title" : "What needs to be done?"}
            className={compact ? "text-sm mt-1" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Show creation date when editing in full mode */}
        {!compact && isEditing && task && (
          <div className="col-span-2">
            <Label>Created On</Label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(task.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Task Type - only in full mode */}
        {!compact && (
          <div>
            <Label htmlFor={getFieldId("type")}>Task Type</Label>
            <Select
              value={data.type}
              onValueChange={(value) =>
                onChange("type", value as "TASK" | "HABIT" | "RECURRING")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TASK">
                  <CheckSquare className="w-4 h-4 inline mr-2" />
                  Regular Task
                </SelectItem>
                <SelectItem value="HABIT">
                  <Dumbbell className="w-4 h-4 inline mr-2" />
                  Habit
                </SelectItem>
                <SelectItem value="RECURRING">
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  Recurring Task
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Priority */}
        <div>
          <Label
            htmlFor={getFieldId("priority")}
            className={compact ? "text-xs" : ""}
          >
            Priority
          </Label>
          <Select
            value={data.priority}
            onValueChange={(value) =>
              onChange("priority", value as "LOW" | "MEDIUM" | "HIGH")
            }
          >
            <SelectTrigger className={compact ? "text-sm mt-1" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Context */}
        <div>
          <Label
            htmlFor={getFieldId("context")}
            className={compact ? "text-xs" : ""}
          >
            Context
          </Label>
          <Select
            value={selectedContextId}
            onValueChange={(value) => onChange("contextId", value)}
          >
            <SelectTrigger className={compact ? "text-sm mt-1" : ""}>
              <SelectValue placeholder="Inbox (default)">
                {selectedContext && (
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${selectedContext.color} mr-2`}
                    />
                    {(() => {
                      const IconComponent = getContextIconComponent(
                        selectedContext.icon,
                      );
                      return <IconComponent className="w-4 h-4 mr-2" />;
                    })()}
                    {selectedContext.name}
                    {selectedContext.isInbox && (
                      <span className="text-xs text-gray-500 ml-2">
                        (default)
                      </span>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {contexts
                .sort((a, b) => {
                  // Sort inbox context first, then alphabetically
                  if (a.isInbox) return -1;
                  if (b.isInbox) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((context) => {
                  const IconComponent = getContextIconComponent(context.icon);
                  return (
                    <SelectItem key={context.id} value={context.id}>
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${context.color} mr-2`}
                        />
                        <IconComponent className="w-4 h-4 mr-2" />
                        {context.name}
                        {context.isInbox && (
                          <span className="text-xs text-gray-500 ml-2">
                            (default)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
          {errors.contextId && (
            <p className="text-sm text-red-500 mt-1">{errors.contextId}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <Label
            htmlFor={getFieldId("dueDate")}
            className={compact ? "text-xs" : ""}
          >
            Due Date
          </Label>
          <Input
            id={getFieldId("dueDate")}
            type="date"
            value={data.dueDate}
            onChange={(e) => onChange("dueDate", e.target.value)}
            className={compact ? "text-sm mt-1" : ""}
          />
        </div>

        {/* Wait Days - only show when due date is set and not in compact mode, and not a habit or recurring type */}
        {!compact &&
          data.dueDate &&
          data.type !== "HABIT" &&
          data.type !== "RECURRING" && (
            <div>
              {showWaitDays ? (
                <div>
                  <Label
                    htmlFor={getFieldId("waitDays")}
                    className="flex items-center gap-2"
                  >
                    Wait Days
                    <Tooltip
                      open={tooltipOpen.task}
                      onOpenChange={(open) =>
                        setTooltipOpen((prev) => ({ ...prev, task: open }))
                      }
                    >
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center cursor-help"
                          onClick={(e) => {
                            e.preventDefault();
                            setTooltipOpen((prev) => ({
                              ...prev,
                              task: !prev.task,
                            }));
                          }}
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        onPointerDownOutside={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <p className="max-w-xs">
                          Number of days before due date to start calculating
                          urgency (task urgency will be 0 until then)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id={getFieldId("waitDays")}
                    type="number"
                    min="0"
                    max="365"
                    value={data.waitDays || ""}
                    onChange={(e) =>
                      onChange(
                        "waitDays",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    placeholder="0"
                    className="text-sm mt-1"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowWaitDays(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Add wait days...
                </button>
              )}
            </div>
          )}

        {/* Habit-specific fields - only in full mode */}
        {!compact && data.type === "HABIT" && (
          <>
            <div>
              <Label htmlFor={getFieldId("habitType")}>Habit Type</Label>
              <Select
                value={data.habitType || ""}
                onValueChange={(value) =>
                  onChange(
                    "habitType",
                    value as "STREAK" | "LEARNING" | "WELLNESS" | "MAINTENANCE",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STREAK">
                    <Dumbbell className="w-4 h-4 inline mr-2" />
                    Streak
                  </SelectItem>
                  <SelectItem value="LEARNING">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Learning
                  </SelectItem>
                  <SelectItem value="WELLNESS">
                    <Heart className="w-4 h-4 inline mr-2" />
                    Wellness
                  </SelectItem>
                  <SelectItem value="MAINTENANCE">
                    <Wrench className="w-4 h-4 inline mr-2" />
                    Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={getFieldId("frequency")}>Frequency (days)</Label>
              <Input
                id={getFieldId("frequency")}
                type="number"
                min={1}
                value={data.frequency || ""}
                onChange={(e) => onChange("frequency", Number(e.target.value))}
              />
              {errors.frequency && (
                <p className="text-sm text-red-500 mt-1">{errors.frequency}</p>
              )}
            </div>

            {/* Wait Days for habits - show after frequency */}
            {data.dueDate && (
              <div>
                {showWaitDays ? (
                  <div>
                    <Label
                      htmlFor={getFieldId("waitDays")}
                      className="flex items-center gap-2"
                    >
                      Wait Days
                      <Tooltip
                        open={tooltipOpen.habit}
                        onOpenChange={(open) =>
                          setTooltipOpen((prev) => ({ ...prev, habit: open }))
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              setTooltipOpen((prev) => ({
                                ...prev,
                                habit: !prev.habit,
                              }));
                            }}
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          onPointerDownOutside={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <p className="max-w-xs">
                            Number of days before due date to start calculating
                            urgency (task urgency will be 0 until then)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id={getFieldId("waitDays")}
                      type="number"
                      min="0"
                      max="365"
                      value={data.waitDays || ""}
                      onChange={(e) =>
                        onChange(
                          "waitDays",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                      className="text-sm mt-1"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowWaitDays(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Add wait days...
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Recurring task-specific fields - only in full mode */}
        {!compact && data.type === "RECURRING" && (
          <>
            <div>
              <Label htmlFor={getFieldId("frequency")}>
                Frequency (days) *
              </Label>
              <Input
                id={getFieldId("frequency")}
                type="number"
                min="1"
                max="365"
                placeholder="1 = daily, 7 = weekly, 30 = monthly"
                value={data.frequency || ""}
                onChange={(e) =>
                  onChange("frequency", parseInt(e.target.value) || undefined)
                }
              />
              {errors.frequency && (
                <p className="text-sm text-red-500 mt-1">{errors.frequency}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                How often this task should repeat (in days)
              </p>
            </div>

            {/* Wait Days for recurring tasks - show after frequency */}
            {data.dueDate && (
              <div>
                {showWaitDays ? (
                  <div>
                    <Label
                      htmlFor={getFieldId("waitDays")}
                      className="flex items-center gap-2"
                    >
                      Wait Days
                      <Tooltip
                        open={tooltipOpen.recurring}
                        onOpenChange={(open) =>
                          setTooltipOpen((prev) => ({
                            ...prev,
                            recurring: open,
                          }))
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              setTooltipOpen((prev) => ({
                                ...prev,
                                recurring: !prev.recurring,
                              }));
                            }}
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          onPointerDownOutside={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <p className="max-w-xs">
                            Number of days before due date to start calculating
                            urgency (task urgency will be 0 until then)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id={getFieldId("waitDays")}
                      type="number"
                      min="0"
                      max="365"
                      value={data.waitDays || ""}
                      onChange={(e) =>
                        onChange(
                          "waitDays",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="0"
                      className="text-sm mt-1"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowWaitDays(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Add wait days...
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Notes - only in full mode */}
        {!compact && (
          <div className="col-span-2">
            <Label htmlFor={getFieldId("notes")}>Notes</Label>
            <Textarea
              id={getFieldId("notes")}
              value={data.notes || ""}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>
        )}

        {/* Subtasks - only in full mode */}
        {!compact && (
          <div className="col-span-2">
            <Label htmlFor={getFieldId("subtasks")}>Subtasks</Label>
            <SubtasksInput
              value={data.subtasks}
              onChange={(subtasks) => onChange("subtasks", subtasks)}
              placeholder="Add a subtask..."
            />
          </div>
        )}

        {/* Tags */}
        <div className={compact ? "col-span-2" : "col-span-2"}>
          <Label htmlFor={getFieldId("tags")}>Tags</Label>
          <TagsInput
            value={data.tags}
            onChange={(tags) => onChange("tags", tags)}
            suggestions={existingTags}
            placeholder="Add tags and press Enter"
            onTagClick={onTagEdit}
          />
        </div>
      </div>
    </div>
  );
}
