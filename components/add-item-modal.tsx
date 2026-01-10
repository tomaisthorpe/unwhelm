"use client";

import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskForm, type TaskFormData } from "@/components/task-form";
import {
  archiveContextAction,
  getExistingTags,
  completeTaskYesterdayAction,
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "@/lib/server-actions";
import { useDashboardActions } from "@/lib/hooks/use-dashboard-actions";
import {
  CheckSquare,
  Home,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Archive,
  Calendar,
  Tag as TagIcon,
} from "lucide-react";
import type { Task, Context, Tag } from "@/lib/data";
import { contextIconOptions } from "@/lib/context-icons";

// Context form schema
const contextSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string(),
  color: z.string(),
  coefficient: z
    .number()
    .min(-100, "Coefficient must be at least -100")
    .max(100, "Coefficient must be at most 100"),
});

// Tag form schema
const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  coefficient: z
    .number()
    .min(-100, "Coefficient must be at least -100")
    .max(100, "Coefficient must be at most 100"),
  color: z.string(),
});

type ContextFormData = z.infer<typeof contextSchema>;
type TagFormData = z.infer<typeof tagSchema>;

interface TaskModalProps {
  contexts: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    coefficient: number;
    isInbox: boolean;
  }>;
  tags?: Tag[];
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  defaultContextId?: string;
  contextToEdit?: Context;
  tagToEdit?: Tag;
  defaultTab?: "task" | "context" | "tag";
  onDataChange?: () => void;
}

const contextColors = [
  { value: "bg-blue-500", label: "Blue", color: "bg-blue-500" },
  { value: "bg-green-500", label: "Green", color: "bg-green-500" },
  { value: "bg-purple-500", label: "Purple", color: "bg-purple-500" },
  { value: "bg-red-500", label: "Red", color: "bg-red-500" },
  { value: "bg-yellow-500", label: "Yellow", color: "bg-yellow-500" },
  { value: "bg-cyan-500", label: "Cyan", color: "bg-cyan-500" },
  { value: "bg-pink-500", label: "Pink", color: "bg-pink-500" },
  { value: "bg-gray-500", label: "Gray", color: "bg-gray-500" },
  { value: "bg-orange-500", label: "Orange", color: "bg-orange-500" },
  { value: "bg-emerald-500", label: "Emerald", color: "bg-emerald-500" },
  { value: "bg-teal-500", label: "Teal", color: "bg-teal-500" },
  { value: "bg-indigo-500", label: "Indigo", color: "bg-indigo-500" },
];

export function TaskModal({
  contexts,
  tags = [],
  task,
  isOpen,
  onClose,
  defaultContextId,
  contextToEdit,
  tagToEdit,
  defaultTab = "task",
  onDataChange,
}: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<"task" | "context" | "tag">(
    defaultTab,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completeYesterdayTooltipOpen, setCompleteYesterdayTooltipOpen] =
    useState(false);
  const { createTask, updateTask, deleteTask, createContext, updateContext } =
    useDashboardActions();

  // Find inbox context for default selection
  const inboxContext = contexts.find((c) => c.isInbox);
  const fallbackContextId = defaultContextId || inboxContext?.id || "";

  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    priority: "MEDIUM",
    contextId: fallbackContextId,
    dueDate: "",
    waitDays: undefined,
    type: "TASK",
    habitType: undefined,
    frequency: undefined,
    tags: [],
    notes: "",
    subtasks: [],
  });

  // Track initial form data to detect unsaved changes
  const [initialTaskFormData, setInitialTaskFormData] =
    useState<TaskFormData | null>(null);

  // Generate unique IDs for this modal instance to prevent conflicts
  const modalId = useId();
  const getFieldId = (fieldName: string) => `${modalId}-${fieldName}`;

  const isEditing = !!task;
  const isEditingContext = !!contextToEdit;
  const isEditingTag = !!tagToEdit;

  const contextForm = useForm<ContextFormData>({
    resolver: zodResolver(contextSchema),
    defaultValues: {
      icon: "Home",
      color: "bg-blue-500",
      coefficient: 0,
    },
  });

  // Load existing tags for autocomplete
  useEffect(() => {
    if (isOpen) {
      getExistingTags().then(setExistingTags);
    }
  }, [isOpen]);

  // Reset forms when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      setError(null); // Clear errors when modal opens
      if (task) {
        // Editing mode - populate form with task data
        const formData = {
          title: task.title,
          priority: task.priority,
          contextId: task.contextId,
          dueDate: task.dueDate
            ? new Date(task.dueDate).toISOString().slice(0, 10)
            : "",
          waitDays: task.waitDays || undefined,
          type: task.type,
          habitType: task.habitType || undefined,
          frequency: task.frequency || undefined,
          tags: task.tags,
          notes: task.notes || "",
          subtasks: task.subtasks || [],
        };
        setTaskFormData(formData);
        setInitialTaskFormData(formData);
        setActiveTab("task");
      } else if (contextToEdit) {
        // Editing a context - populate context form
        contextForm.reset({
          name: contextToEdit.name,
          description: contextToEdit.description || "",
          icon: contextToEdit.icon,
          color: contextToEdit.color,
          coefficient: contextToEdit.coefficient || 0,
        });
        setActiveTab("context");
      } else if (tagToEdit) {
        // Editing a tag - populate tag form
        tagForm.reset({
          name: tagToEdit.name,
          coefficient: tagToEdit.coefficient || 0,
          color: tagToEdit.color,
        });
        setActiveTab("tag");
      } else {
        // Adding mode - reset to defaults
        const currentFallbackContextId =
          defaultContextId || inboxContext?.id || "";
        const defaultFormData = {
          title: "",
          priority: "MEDIUM" as const,
          contextId: currentFallbackContextId,
          dueDate: "",
          waitDays: undefined,
          type: "TASK" as const,
          habitType: undefined,
          frequency: undefined,
          tags: [],
          notes: "",
          subtasks: [],
        };
        setTaskFormData(defaultFormData);
        setInitialTaskFormData(defaultFormData);
        // Also reset context form to defaults
        contextForm.reset({
          name: "",
          description: "",
          icon: "Home",
          color: "bg-blue-500",
          coefficient: 0,
        });
        setActiveTab(defaultTab);
      }
    }
  }, [
    isOpen,
    task?.id,
    defaultContextId,
    contextToEdit?.id,
    inboxContext?.id,
    tagToEdit?.id,
  ]);

  // Check if the task form has unsaved changes
  const hasUnsavedTaskChanges = () => {
    if (!initialTaskFormData || activeTab !== "task") return false;

    // Deep comparison of form data
    return (
      taskFormData.title !== initialTaskFormData.title ||
      taskFormData.priority !== initialTaskFormData.priority ||
      taskFormData.contextId !== initialTaskFormData.contextId ||
      taskFormData.dueDate !== initialTaskFormData.dueDate ||
      taskFormData.waitDays !== initialTaskFormData.waitDays ||
      taskFormData.type !== initialTaskFormData.type ||
      taskFormData.habitType !== initialTaskFormData.habitType ||
      taskFormData.frequency !== initialTaskFormData.frequency ||
      taskFormData.notes !== initialTaskFormData.notes ||
      JSON.stringify(taskFormData.tags) !==
        JSON.stringify(initialTaskFormData.tags) ||
      JSON.stringify(taskFormData.subtasks) !==
        JSON.stringify(initialTaskFormData.subtasks)
    );
  };

  // Handle modal close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedTaskChanges()) {
      setShowUnsavedChangesConfirm(true);
    } else {
      onClose();
    }
  };

  // Force close without checking for unsaved changes
  const forceClose = () => {
    setShowUnsavedChangesConfirm(false);
    onClose();
  };

  const handleTaskFormChange = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ) => {
    setTaskFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const handleTagEdit = (tagName: string) => {
    // Find the tag in the tags array
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
    );

    if (existingTag) {
      // Edit existing tag
      tagForm.reset({
        name: existingTag.name,
        coefficient: existingTag.coefficient,
        color: existingTag.color,
      });
      setActiveTab("tag");
    } else {
      // Create new tag with this name
      tagForm.reset({
        name: tagName,
        coefficient: 0,
        color: "bg-blue-500",
      });
      setActiveTab("tag");
    }
  };

  const onSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!taskFormData.title.trim()) return;
    // Context is no longer required since we have inbox fallback
    if (taskFormData.type === "RECURRING" && !taskFormData.frequency) return;

    // Clear any previous errors and set loading state
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    if (isEditing && task) {
      formData.append("taskId", task.id);
    }
    formData.append("title", taskFormData.title);
    formData.append("priority", taskFormData.priority);
    formData.append("contextId", taskFormData.contextId);
    if (taskFormData.dueDate) formData.append("dueDate", taskFormData.dueDate);
    if (taskFormData.waitDays != null)
      formData.append("waitDays", taskFormData.waitDays.toString());
    formData.append("type", taskFormData.type);
    if (taskFormData.habitType)
      formData.append("habitType", taskFormData.habitType);
    if (taskFormData.frequency)
      formData.append("frequency", taskFormData.frequency.toString());

    // Convert tags array to comma-separated string for form data
    formData.append("tags", taskFormData.tags.join(", "));

    // Add notes field
    if (taskFormData.notes) formData.append("notes", taskFormData.notes);

    // Add subtasks as JSON string
    formData.append("subtasks", JSON.stringify(taskFormData.subtasks));

    try {
      if (isEditing) {
        await updateTask(formData);
      } else {
        await createTask(formData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
      setError(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitContext = async (data: ContextFormData) => {
    setIsLoading(true);
    const formData = new FormData();
    if (isEditingContext && contextToEdit) {
      formData.append("contextId", contextToEdit.id);
    }
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    formData.append("icon", data.icon);
    formData.append("color", data.color);
    formData.append("coefficient", data.coefficient.toString());

    try {
      if (isEditingContext) {
        await updateContext(formData);
      } else {
        await createContext(formData);
      }
      contextForm.reset();
      onClose();
    } catch (error) {
      console.error("Failed to save context:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save context",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tagForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      coefficient: 0,
      color: "bg-blue-500",
    },
  });

  const onSubmitTag = async (data: TagFormData) => {
    setIsLoading(true);
    const formData = new FormData();

    // Check if we're editing an existing tag
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === data.name.toLowerCase(),
    );

    if (existingTag) {
      // Update existing tag
      formData.append("tagId", existingTag.id);
      formData.append("name", data.name);
      formData.append("coefficient", data.coefficient.toString());
      formData.append("color", data.color);

      try {
        await updateTagAction(formData);
        tagForm.reset();
        onClose();
      } catch (error) {
        console.error("Failed to update tag:", error);
        setError(
          error instanceof Error ? error.message : "Failed to update tag",
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Create new tag
      formData.append("name", data.name);
      formData.append("coefficient", data.coefficient.toString());
      formData.append("color", data.color);

      try {
        await createTagAction(formData);
        tagForm.reset();
        onClose();
      } catch (error) {
        console.error("Failed to create tag:", error);
        setError(
          error instanceof Error ? error.message : "Failed to create tag",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    setIsLoading(true);

    try {
      await deleteTask(task.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete task",
      );
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteYesterday = async () => {
    if (!task) return;
    setIsLoading(true);

    try {
      await completeTaskYesterdayAction(task.id);
      onClose();
    } catch (error) {
      console.error("Failed to complete task yesterday:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to complete task yesterday",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveContext = async () => {
    if (!contextToEdit) return;
    setIsLoading(true);

    try {
      await archiveContextAction(contextToEdit.id);
      // Trigger immediate data refresh
      onDataChange?.();
      setShowArchiveConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to archive context:", error);
      setError(
        error instanceof Error ? error.message : "Failed to archive context",
      );
      setShowArchiveConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation errors for TaskForm
  const getTaskFormErrors = () => {
    const errors: Partial<Record<keyof TaskFormData, string>> = {};
    if (!taskFormData.title.trim()) {
      errors.title = "Title is required";
    }
    // Context is no longer required since we have inbox fallback
    if (taskFormData.type === "RECURRING" && !taskFormData.frequency) {
      errors.frequency = "Frequency is required for recurring tasks";
    }
    return errors;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      modal={true}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl rounded-2xl border-0">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing
                ? "Edit Task"
                : isEditingContext
                  ? "Edit Context"
                  : isEditingTag
                    ? "Edit Tag"
                    : "Add New Item"}
            </DialogTitle>

            {/* Quick Actions in Header - Only for editing tasks */}
            {isEditing && activeTab === "task" && !task?.completed && (
              <div className="flex items-center space-x-2 mr-8">
                <Tooltip
                  open={completeYesterdayTooltipOpen}
                  onOpenChange={setCompleteYesterdayTooltipOpen}
                >
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCompleteYesterday}
                      disabled={isLoading}
                      className="text-xs"
                      tabIndex={-1}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Complete Yesterday
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">
                      Mark this task as completed yesterday. Useful if you
                      forgot to check off a task you finished the day before.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Tab Navigation - Only show when creating new items (not editing) */}
        {!isEditing && !isEditingContext && !isEditingTag ? (
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1 mt-2 mb-6">
            <button
              onClick={() => setActiveTab("task")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                ${
                  activeTab === "task"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }
              `}
              type="button"
            >
              <CheckSquare className="w-4 h-4 inline mr-2" />
              Add Task
            </button>
            <button
              onClick={() => setActiveTab("context")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                ${
                  activeTab === "context"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }
              `}
              type="button"
            >
              <Home className="w-4 h-4 inline mr-2" />
              Add Context
            </button>
            <button
              onClick={() => setActiveTab("tag")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                ${
                  activeTab === "tag"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }
              `}
              type="button"
            >
              <TagIcon className="w-4 h-4 inline mr-2" />
              Add Tag
            </button>
          </div>
        ) : (
          // Add spacing when tabs are hidden (editing mode)
          <div className="mt-2" />
        )}

        {/* Task Form */}
        {activeTab === "task" && (
          <form
            onSubmit={onSubmitTask}
            className="space-y-4"
            data-task-form="true"
          >
            <TaskForm
              data={taskFormData}
              onChange={handleTaskFormChange}
              contexts={contexts}
              existingTags={existingTags}
              errors={getTaskFormErrors()}
              compact={false}
              isEditing={isEditing}
              task={task}
              fieldIdPrefix={modalId}
              onTagEdit={handleTagEdit}
            />

            <div className="flex justify-between pt-4">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </Button>
              )}
              <div className="flex space-x-2 ml-auto">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Task"
                      : "Create Task"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Context Form */}
        {activeTab === "context" && (
          <form
            onSubmit={contextForm.handleSubmit(onSubmitContext)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor={getFieldId("name")}>
                  Context Name *
                  {contextToEdit?.isInbox && (
                    <span className="text-xs text-gray-500 ml-2">
                      (cannot be changed)
                    </span>
                  )}
                </Label>
                <Input
                  id={getFieldId("name")}
                  placeholder="e.g., Work, Home, Kitchen"
                  disabled={contextToEdit?.isInbox}
                  {...contextForm.register("name")}
                />
                {contextForm.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {contextForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={getFieldId("icon")}>Icon</Label>
                <Select
                  value={contextForm.watch("icon")}
                  onValueChange={(value) => contextForm.setValue("icon", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {contextIconOptions.map(({ value, icon: Icon, label }) => (
                      <SelectItem key={value} value={value}>
                        <Icon className="w-4 h-4 inline mr-2" />
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={getFieldId("color")}>Color</Label>
                <Select
                  value={contextForm.watch("color")}
                  onValueChange={(value) =>
                    contextForm.setValue("color", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contextColors.map(({ value, label, color }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full ${color} mr-2`}
                          />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor={getFieldId("coefficient")}>
                  Context Coefficient
                </Label>
                <Input
                  id={getFieldId("coefficient")}
                  type="number"
                  min="-100"
                  max="100"
                  step="0.1"
                  placeholder="0 (default)"
                  {...contextForm.register("coefficient", {
                    valueAsNumber: true,
                  })}
                />
                {contextForm.formState.errors.coefficient && (
                  <p className="text-sm text-red-500 mt-1">
                    {contextForm.formState.errors.coefficient.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Adds a fixed value to task urgency calculations. Use positive
                  values for higher priority contexts.
                </p>
              </div>

              <div className="col-span-2">
                <Label htmlFor={getFieldId("description")}>Description</Label>
                <Textarea
                  id={getFieldId("description")}
                  placeholder="Optional description"
                  {...contextForm.register("description")}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              {isEditingContext && !contextToEdit?.isInbox && (
                <Button
                  type="button"
                  variant="outline-destructive"
                  onClick={() => setShowArchiveConfirm(true)}
                  disabled={isLoading}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Context
                </Button>
              )}
              <div className="flex space-x-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading || (isEditingContext && contextToEdit?.isInbox)
                  }
                >
                  {isLoading
                    ? isEditingContext
                      ? "Updating..."
                      : "Creating..."
                    : isEditingContext
                      ? "Update Context"
                      : "Create Context"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Tag Form */}
        {activeTab === "tag" && (
          <form
            onSubmit={tagForm.handleSubmit(onSubmitTag)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor={getFieldId("name")}>Tag Name *</Label>
                <Input
                  id={getFieldId("name")}
                  placeholder="e.g., Work, Home, Kitchen"
                  {...tagForm.register("name")}
                />
                {tagForm.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {tagForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={getFieldId("color")}>Color</Label>
                <Select
                  value={tagForm.watch("color")}
                  onValueChange={(value) => tagForm.setValue("color", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contextColors.map(({ value, label, color }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full ${color} mr-2`}
                          />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor={getFieldId("coefficient")}>
                  Tag Coefficient
                </Label>
                <Input
                  id={getFieldId("coefficient")}
                  type="number"
                  min="-100"
                  max="100"
                  step="0.1"
                  placeholder="0 (default)"
                  {...tagForm.register("coefficient", {
                    valueAsNumber: true,
                  })}
                />
                {tagForm.formState.errors.coefficient && (
                  <p className="text-sm text-red-500 mt-1">
                    {tagForm.formState.errors.coefficient.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Adds a fixed value to task urgency calculations. Use positive
                  values for higher priority tags.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <div className="flex space-x-2 ml-auto">
                {/* Delete button for existing tags */}
                {tags.find(
                  (tag) =>
                    tag.name.toLowerCase() ===
                    tagForm.watch("name").toLowerCase(),
                ) && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      const existingTag = tags.find(
                        (tag) =>
                          tag.name.toLowerCase() ===
                          tagForm.watch("name").toLowerCase(),
                      );
                      if (existingTag) {
                        setIsLoading(true);
                        try {
                          await deleteTagAction(existingTag.id);
                          tagForm.reset();
                          onClose();
                        } catch (error) {
                          console.error("Failed to delete tag:", error);
                          setError(
                            error instanceof Error
                              ? error.message
                              : "Failed to delete tag",
                          );
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Tag
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? tags.find(
                        (tag) =>
                          tag.name.toLowerCase() ===
                          tagForm.watch("name").toLowerCase(),
                      )
                      ? "Updating..."
                      : "Creating..."
                    : tags.find(
                          (tag) =>
                            tag.name.toLowerCase() ===
                            tagForm.watch("name").toLowerCase(),
                        )
                      ? "Update Tag"
                      : "Create Tag"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>

      {/* Delete confirmation dialog */}
      {isEditing && (
        <Dialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          modal={true}
        >
          <DialogContent
            className="bg-white z-[10001]"
            overlayClassName="z-[10000]"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                Confirm Delete
              </DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTask}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive confirmation dialog */}
      {isEditingContext && (
        <Dialog
          open={showArchiveConfirm}
          onOpenChange={setShowArchiveConfirm}
          modal={true}
        >
          <DialogContent
            className="bg-white z-[10001]"
            overlayClassName="z-[10000]"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Archive className="w-4 h-4 text-orange-600 mr-2" />
                Archive Context
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p>Are you sure you want to archive this context?</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Archiving will permanently delete all
                  incomplete tasks in this context. Completed tasks will be
                  preserved and visible in the completed tasks page.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleArchiveContext}
                disabled={isLoading}
              >
                {isLoading ? "Archiving..." : "Archive Context"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Unsaved changes confirmation dialog */}
      <Dialog
        open={showUnsavedChangesConfirm}
        onOpenChange={setShowUnsavedChangesConfirm}
        modal={true}
      >
        <DialogContent
          className="bg-white z-[10001]"
          overlayClassName="z-[10000]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
              Unsaved Changes
            </DialogTitle>
          </DialogHeader>
          <p>
            You have unsaved changes. Would you like to save them before
            closing?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={forceClose}>
              Discard Changes
            </Button>
            <Button
              onClick={async () => {
                setShowUnsavedChangesConfirm(false);
                // Trigger form submission by creating a synthetic event
                const form = document.querySelector(
                  'form[data-task-form="true"]',
                ) as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Legacy component for backward compatibility and add button
export function AddItemModal({
  contexts,
  tags = [],
  defaultContextId,
  addButtonSize = "lg",
  defaultTab = "task",
  buttonContent,
  onDataChange,
}: {
  contexts: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    coefficient: number;
    isInbox: boolean;
  }>;
  tags?: Tag[];
  defaultContextId?: string;
  addButtonSize?: "sm" | "lg" | "icon";
  defaultTab?: "task" | "context" | "tag";
  buttonContent?: React.ReactNode;
  onDataChange?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {addButtonSize === "icon" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Add Context"
        >
          {buttonContent || <Plus className="w-4 h-4" />}
        </button>
      ) : addButtonSize === "sm" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      ) : (
        <Button onClick={() => setIsOpen(true)} variant="default" size="lg">
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </Button>
      )}

      <TaskModal
        contexts={contexts}
        tags={tags}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultContextId={defaultContextId}
        defaultTab={defaultTab}
        onDataChange={onDataChange}
      />
    </>
  );
}
