"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Archive, Search, X } from "lucide-react";
import type { Context, Task, Tag } from "@/lib/data";
import { ContextGroup } from "@/components/context-group";
import { ArchivedContexts } from "@/components/archived-contexts";
import { AddItemModal } from "@/components/add-item-modal";

interface ContextsSectionProps {
  contexts: Context[];
  tasks: Task[];
  tags: Tag[];
  collapsedState?: Record<string, boolean>;
  onCollapsedStateChange?: (collapsedState: Record<string, boolean>) => void;
  archivedContexts: Context[];
  onDataChange?: () => void;
}

export function ContextsSection({
  contexts,
  tasks,
  tags,
  collapsedState = {},
  onCollapsedStateChange,
  archivedContexts,
  onDataChange,
}: ContextsSectionProps) {
  const [showArchivedContexts, setShowArchivedContexts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    for (const c of filteredContexts) next[c.id] = false;
    onCollapsedStateChange?.(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const c of filteredContexts) next[c.id] = true;
    onCollapsedStateChange?.(next);
  };

  // Helper function to check if a context has tasks matching the search query
  const hasTaskMatches = (context: Context): boolean => {
    if (searchQuery.trim() === "") return false;

    const contextTasks = tasks.filter((task) => task.contextId === context.id);
    const searchLower = searchQuery.toLowerCase();

    return contextTasks.some(
      (task) =>
        task.title.toLowerCase().includes(searchLower) ||
        task.notes?.toLowerCase().includes(searchLower) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  };

  // Filter contexts based on search query
  const filteredContexts =
    searchQuery.trim() === ""
      ? contexts
      : contexts.filter((context) => {
          // Check if context name matches
          if (context.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return true;
          }

          // Check if context description matches
          if (
            context.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
          ) {
            return true;
          }

          // Check if any tasks in this context match the search
          return hasTaskMatches(context);
        });

  // Check if all contexts are effectively collapsed/expanded
  // This takes into account temporary expansion due to search matches
  const allCollapsed =
    filteredContexts.length > 0 &&
    filteredContexts.every((c) => {
      const shouldTemporarilyExpand = hasTaskMatches(c);
      const savedCollapsed = collapsedState[c.id] ?? false;
      const effectiveCollapsed = shouldTemporarilyExpand
        ? false
        : savedCollapsed;
      return effectiveCollapsed === true;
    });
  const allExpanded =
    filteredContexts.length > 0 &&
    filteredContexts.every((c) => {
      const shouldTemporarilyExpand = hasTaskMatches(c);
      const savedCollapsed = collapsedState[c.id] ?? false;
      const effectiveCollapsed = shouldTemporarilyExpand
        ? false
        : savedCollapsed;
      return effectiveCollapsed === false;
    });

  // Scroll to keep search bar visible when searching
  useEffect(() => {
    if (searchQuery.trim() !== "" && searchContainerRef.current) {
      // Use a small delay to ensure DOM has updated with filtered results
      setTimeout(() => {
        searchContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [searchQuery, filteredContexts.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contexts</h2>
          <AddItemModal
            contexts={contexts}
            tags={tags}
            addButtonSize="icon"
            defaultTab="context"
            onDataChange={onDataChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={handleExpandAll}
            disabled={allExpanded}
          >
            <ChevronDown className="w-4 h-4 mr-1" /> Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={handleCollapseAll}
            disabled={allCollapsed}
          >
            <ChevronUp className="w-4 h-4 mr-1" /> Collapse all
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div ref={searchContainerRef} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search tasks, contexts, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filteredContexts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredContexts.map((context) => {
            // Compute effective collapsed state
            // If search is active and context has task matches, temporarily expand it
            const savedCollapsedValue = collapsedState[context.id] ?? false;
            const shouldTemporarilyExpand = hasTaskMatches(context);
            const effectiveCollapsed = shouldTemporarilyExpand
              ? false
              : savedCollapsedValue;

            return (
              <ContextGroup
                key={context.id}
                context={context}
                tasks={tasks}
                allContexts={contexts}
                tags={tags}
                collapsed={effectiveCollapsed}
                onCollapsedChange={(value: boolean) =>
                  onCollapsedStateChange?.({
                    ...collapsedState,
                    [context.id]: value,
                  })
                }
                searchQuery={searchQuery}
                onDataChange={onDataChange}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery.trim() === ""
              ? "No contexts yet. Create one to get started!"
              : `No contexts or tasks match "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* View Archived Contexts Button */}
      <div className="flex justify-center mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchivedContexts(true)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Archive className="w-4 h-4 mr-2" />
          View Archived Contexts
        </Button>
      </div>

      {/* Archived Contexts Modal */}
      <ArchivedContexts
        archivedContexts={archivedContexts}
        isOpen={showArchivedContexts}
        onClose={() => setShowArchivedContexts(false)}
        onDataChange={onDataChange}
      />
    </div>
  );
}
