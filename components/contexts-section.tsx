"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Archive, Search, X } from "lucide-react";
import type { Context, Task, Tag } from "@/lib/data";
import { parseTaskSearch, matchesTaskSearch, matchesContextSearch } from "@/lib/task-search";
import { ContextGroup } from "@/components/context-group";
import { ContextGroupContainer } from "@/components/context-group-container";
import { ArchivedContexts } from "@/components/archived-contexts";
import { AddContextModal } from "@/components/add-item-modal";

interface ContextsSectionProps {
  contexts: Context[];
  tasks: Task[];
  tags: Tag[];
  collapsedState?: Record<string, boolean>;
  onCollapsedStateChange?: (collapsedState: Record<string, boolean>) => void;
  archivedContexts: Context[];
  onDataChange?: () => void;
  readOnly?: boolean;
  hideSearch?: boolean;
  defaultCollapsed?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export function ContextsSection({
  contexts,
  tasks,
  tags,
  collapsedState = {},
  onCollapsedStateChange,
  archivedContexts,
  onDataChange,
  readOnly,
  hideSearch,
  defaultCollapsed = false,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
}: ContextsSectionProps) {
  const [showArchivedContexts, setShowArchivedContexts] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const setSearchQuery = onSearchQueryChange ?? setInternalSearchQuery;
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

  const search = parseTaskSearch(searchQuery);
  const hasSearch = searchQuery.trim() !== "";

  const hasTaskMatches = (context: Context): boolean =>
    hasSearch && tasks.some((task) =>
      task.contextId === context.id && matchesTaskSearch(task, search, context),
    );

  const filteredContexts = !hasSearch
    ? contexts
    : contexts.filter((context) =>
        (search.priorities.length === 0 && matchesContextSearch(context, search.text)) ||
        hasTaskMatches(context),
      );

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
      <div
        ref={searchContainerRef}
        className={
          hideSearch
            ? "space-y-4"
            : "sticky top-0 z-20 -mx-4 space-y-4 bg-gray-50 px-4 py-4 dark:bg-gray-950"
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contexts</h2>
            {!readOnly && (
              <AddContextModal
                contexts={contexts}
                onDataChange={onDataChange}
              />
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={handleExpandAll}
              disabled={allExpanded}
              aria-label="Expand all contexts"
              title="Expand all contexts"
            >
              <ChevronDown className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Expand all</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={handleCollapseAll}
              disabled={allCollapsed}
              aria-label="Collapse all contexts"
              title="Collapse all contexts"
            >
              <ChevronUp className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Collapse all</span>
            </Button>
          </div>
        </div>

        {/* Search Input */}
        {!hideSearch && (
          <div className="space-y-1">
            <div className="relative">
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
          </div>
        )}
      </div>

      {filteredContexts.length > 0 ? (
        <div
          className={
            hideSearch
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 gap-4 *:scroll-mt-32"
          }
        >
          {filteredContexts.map((context) => {
            // Compute effective collapsed state
            // If search is active and context has task matches, temporarily expand it
            const savedCollapsedValue = collapsedState[context.id] ?? defaultCollapsed;
            const shouldTemporarilyExpand = hasTaskMatches(context);
            const effectiveCollapsed = shouldTemporarilyExpand
              ? false
              : savedCollapsedValue;

            return readOnly ? (
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
                onTagClick={
                  hideSearch ? undefined : (tag) => setSearchQuery(`#${tag}`)
                }
                readOnly
              />
            ) : (
              <ContextGroupContainer
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
                onTagClick={
                  hideSearch ? undefined : (tag) => setSearchQuery(`#${tag}`)
                }
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
      {!readOnly && (
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
      )}

      {/* Archived Contexts Modal */}
      {!readOnly && (
        <ArchivedContexts
          archivedContexts={archivedContexts}
          isOpen={showArchivedContexts}
          onClose={() => setShowArchivedContexts(false)}
          onDataChange={onDataChange}
        />
      )}
    </div>
  );
}
