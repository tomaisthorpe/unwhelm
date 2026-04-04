"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface SubtasksInputProps {
  value: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  placeholder?: string;
}

interface SortableSubtaskItemProps {
  subtask: Subtask;
  onUpdate: (id: string, updates: Partial<Subtask>) => void;
  onRemove: (id: string) => void;
}

function SortableSubtaskItem({
  subtask,
  onUpdate,
  onRemove,
}: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-0 px-0 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md group ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mr-1"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={(checked) =>
          onUpdate(subtask.id, { completed: checked === true })
        }
      />
      <Input
        value={subtask.text}
        onChange={(e) => onUpdate(subtask.id, { text: e.target.value })}
        className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Subtask text"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(subtask.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 h-6 w-6 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function SubtasksInput({
  value = [],
  onChange,
  placeholder = "Add a subtask...",
}: SubtasksInputProps) {
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSubtask = () => {
    if (newSubtaskText.trim()) {
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newSubtaskText.trim(),
        completed: false,
      };
      onChange([...value, newSubtask]);
      setNewSubtaskText("");
    }
  };

  const removeSubtask = (id: string) => {
    onChange(value.filter((subtask) => subtask.id !== id));
  };

  const updateSubtask = (id: string, updates: Partial<Subtask>) => {
    onChange(
      value.map((subtask) =>
        subtask.id === id ? { ...subtask, ...updates } : subtask
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = value.findIndex((subtask) => subtask.id === active.id);
      const newIndex = value.findIndex((subtask) => subtask.id === over?.id);

      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask();
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing Subtasks */}
      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value.map((subtask) => subtask.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {value.map((subtask) => (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onUpdate={updateSubtask}
                  onRemove={removeSubtask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add New Subtask */}
      <div className="flex items-center gap-2">
        <Input
          value={newSubtaskText}
          onChange={(e) => setNewSubtaskText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSubtask}
          disabled={!newSubtaskText.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Subtask Summary */}
      {value.length > 0 && (
        <div className="text-xs text-gray-500">
          {value.filter((s) => s.completed).length} of {value.length} completed
        </div>
      )}
    </div>
  );
}
