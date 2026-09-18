"use client";

import { useState } from "react";
import { AddTaskModal, ContextModal } from "./add-item-modal";
import { ContextGroup } from "./context-group";
import type { Context, Task, Tag } from "@/lib/data";

interface ContextGroupContainerProps {
  context: Context;
  tasks: Task[];
  allContexts: Context[];
  tags: Tag[];
  collapsed?: boolean;
  onCollapsedChange?: (value: boolean) => void;
  searchQuery?: string;
  onTagClick?: (tag: string) => void;
  onDataChange?: () => void;
}

export function ContextGroupContainer({
  context,
  tasks,
  allContexts,
  tags,
  collapsed,
  onCollapsedChange,
  searchQuery,
  onTagClick,
  onDataChange,
}: ContextGroupContainerProps) {
  const [isEditContextOpen, setIsEditContextOpen] = useState(false);

  return (
    <>
      <ContextGroup
        context={context}
        tasks={tasks}
        allContexts={allContexts}
        tags={tags}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        searchQuery={searchQuery}
        onTagClick={onTagClick}
        onDataChange={onDataChange}
        onEditContext={context.isInbox ? undefined : () => setIsEditContextOpen(true)}
        addTaskNode={
          <AddTaskModal
            contexts={allContexts}
            tags={tags}
            defaultContextId={context.id}
            addButtonSize="sm"
            onDataChange={onDataChange}
          />
        }
      />
      <ContextModal
        contexts={allContexts}
        contextToEdit={context}
        isOpen={isEditContextOpen}
        onClose={() => setIsEditContextOpen(false)}
        onDataChange={onDataChange}
      />
    </>
  );
}
