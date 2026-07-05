"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import * as chrono from "chrono-node";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskForm, type TaskFormData } from "@/components/task-form";
import { getExistingTags } from "@/lib/server-actions";
import { useDashboardActions } from "@/lib/hooks/use-dashboard-actions";
import {
  Send,
  Calendar,
  Hash,
  Zap,
  Edit3,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { diffInLocalCalendarDays } from "@/lib/date-utils";
import { getContextIconComponent } from "@/lib/context-icons";

interface SmartTaskInputProps {
  contexts: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    coefficient: number;
    isInbox: boolean;
  }>;
  className?: string;
  onTaskCreated?: () => void;
}

interface ParsedTask {
  title: string;
  contextId: string | null;
  contextName: string | null;
  tags: string[];
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  dueDateText: string | null;
  type: "TASK" | "RECURRING";
  frequency: number | undefined;
  recurringText: string | null;
  notes?: string;
}

interface ParsedSegment {
  text: string;
  type: "text" | "context" | "tag" | "priority" | "date" | "recurring";
  startIndex: number;
  endIndex: number;
}

interface Suggestion {
  text: string;
  type: "tag" | "context";
  displayText: string;
}

export function SmartTaskInput({
  contexts,
  className,
  onTaskCreated,
}: SmartTaskInputProps) {
  const [input, setInput] = useState("");
  // Manual edit overrides (used when in edit mode)
  const [editOverrides, setEditOverrides] = useState<Partial<ParsedTask>>({});
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [suggestionTrigger, setSuggestionTrigger] = useState<{
    type: "tag" | "context";
    startPos: number;
    query: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set());
  const { createTask } = useDashboardActions();

  const inputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const shouldRefocusAfterSubmitRef = useRef<boolean>(false);

  // Load existing tags on mount
  useEffect(() => {
    getExistingTags().then(setExistingTags);
  }, []);

  // Refocus input after successful submission when pending clears
  useEffect(() => {
    if (!isPending && shouldRefocusAfterSubmitRef.current) {
      inputRef.current?.focus();
      shouldRefocusAfterSubmitRef.current = false;
    }
  }, [isPending]);

  // Parse the input text
  const parseInput = useCallback(
    (text: string): { task: ParsedTask; segments: ParsedSegment[] } => {
      let workingText = text;
      const result: ParsedTask = {
        title: "",
        contextId: null,
        contextName: null,
        tags: [],
        priority: "MEDIUM",
        dueDate: null,
        dueDateText: null,
        type: "TASK",
        frequency: undefined,
        recurringText: null,
      };
      const newSegments: ParsedSegment[] = [];

      // Parse context (!contextName) - support spaces in context names
      // Only match contexts that exist in the database and are complete
      let bestMatch: {
        context: (typeof contexts)[0];
        startIndex: number;
        matchText: string;
      } | null = null;

      // Find all possible context matches and select the first one that appears in the text
      // If multiple contexts appear at the same position, prefer the longer match
      // Only match if the context name is complete (followed by space, end of string, or special char)
      for (const context of contexts) {
        const contextPattern = `!${context.name}`;
        const contextIndex = text
          .toLowerCase()
          .indexOf(contextPattern.toLowerCase());

        if (
          contextIndex !== -1 &&
          !ignoredMatches.has(contextPattern.toLowerCase().trim())
        ) {
          // Check if this is a complete match (not a partial substring)
          const endIndex = contextIndex + contextPattern.length;
          const charAfter = text[endIndex];

          // Context is valid if followed by: space, end of string, or special chars like # or !
          const isCompleteMatch =
            !charAfter ||
            charAfter === " " ||
            charAfter === "#" ||
            charAfter === "!";

          if (isCompleteMatch) {
            // Prioritize by position first (earliest wins), then by length (longest wins if at same position)
            if (
              !bestMatch ||
              contextIndex < bestMatch.startIndex ||
              (contextIndex === bestMatch.startIndex &&
                contextPattern.length > bestMatch.matchText.length)
            ) {
              bestMatch = {
                context,
                startIndex: contextIndex,
                matchText: text.substring(
                  contextIndex,
                  contextIndex + contextPattern.length,
                ),
              };
            }
          }
        }
      }

      if (bestMatch) {
        result.contextId = bestMatch.context.id;
        result.contextName = bestMatch.context.name;

        newSegments.push({
          text: bestMatch.matchText,
          type: "context",
          startIndex: bestMatch.startIndex,
          endIndex: bestMatch.startIndex + bestMatch.matchText.length,
        });

        workingText = workingText.replace(bestMatch.matchText, " ");
      }

      // No fallback - only match contexts that actually exist in the database
      // This ensures partial matches like "!hom" don't get highlighted
      // Users can still create tasks with unknown contexts via the edit form

      // Parse tags (#tagname)
      const tagMatches = [...workingText.matchAll(/#([a-zA-Z0-9_-]+)/gi)];
      tagMatches.forEach((match) => {
        if (!ignoredMatches.has(match[0].toLowerCase().trim())) {
          const tagName = match[1].toLowerCase();
          result.tags.push(tagName);

          const startIndex = text.indexOf(match[0]);
          newSegments.push({
            text: match[0],
            type: "tag",
            startIndex,
            endIndex: startIndex + match[0].length,
          });

          workingText = workingText.replace(match[0], " ");
        }
      });

      // Parse priority (p1, p2, p3)
      const priorityMatch = workingText.match(/\bp([123])\b/i);
      if (
        priorityMatch &&
        !ignoredMatches.has(priorityMatch[0].toLowerCase().trim())
      ) {
        const priorityNum = priorityMatch[1];
        result.priority =
          priorityNum === "1" ? "HIGH" : priorityNum === "2" ? "MEDIUM" : "LOW";

        const startIndex = text.indexOf(priorityMatch[0]);
        newSegments.push({
          text: priorityMatch[0],
          type: "priority",
          startIndex,
          endIndex: startIndex + priorityMatch[0].length,
        });

        workingText = workingText.replace(priorityMatch[0], " ");
      }

      // Parse recurring patterns (daily, weekly, monthly, etc.)
      const recurringPatterns = [
        { pattern: /\bdaily\b/i, frequency: 1, text: "daily" },
        { pattern: /\bweekly\b/i, frequency: 7, text: "weekly" },
        { pattern: /\bfortnightly\b/i, frequency: 14, text: "fortnightly" },
        { pattern: /\bbiweekly\b/i, frequency: 14, text: "biweekly" },
        { pattern: /\bmonthly\b/i, frequency: 30, text: "monthly" },
        { pattern: /\byearly\b/i, frequency: 365, text: "yearly" },
        { pattern: /\bannually\b/i, frequency: 365, text: "annually" },
        // "every [period]" patterns
        { pattern: /\bevery\s+day\b/i, frequency: 1, text: "every day" },
        { pattern: /\bevery\s+week\b/i, frequency: 7, text: "every week" },
        { pattern: /\bevery\s+month\b/i, frequency: 30, text: "every month" },
        { pattern: /\bevery\s+year\b/i, frequency: 365, text: "every year" },
        // "every X days/weeks/months" patterns (with numbers)
        { pattern: /\bevery\s+(\d+)\s+days?\b/i, frequency: null, text: null }, // Special case
        { pattern: /\bevery\s+(\d+)\s+weeks?\b/i, frequency: null, text: null }, // Special case
        {
          pattern: /\bevery\s+(\d+)\s+months?\b/i,
          frequency: null,
          text: null,
        }, // Special case
      ];

      for (const {
        pattern,
        frequency,
        text: patternText,
      } of recurringPatterns) {
        const match = workingText.match(pattern);
        if (match && !ignoredMatches.has(match[0].toLowerCase().trim())) {
          let actualFrequency = frequency;
          let actualText = patternText;

          // Handle "every X days/weeks/months" patterns
          if (frequency === null && match[1]) {
            const num = parseInt(match[1]);
            if (pattern.source.includes("days")) {
              actualFrequency = num;
              actualText = `every ${num} day${num === 1 ? "" : "s"}`;
            } else if (pattern.source.includes("weeks")) {
              actualFrequency = num * 7;
              actualText = `every ${num} week${num === 1 ? "" : "s"}`;
            } else if (pattern.source.includes("months")) {
              actualFrequency = num * 30;
              actualText = `every ${num} month${num === 1 ? "" : "s"}`;
            }
          }

          if (actualFrequency && actualText) {
            result.type = "RECURRING";
            result.frequency = actualFrequency;
            result.recurringText = actualText;

            const startIndex = text.indexOf(match[0]);
            if (startIndex !== -1) {
              newSegments.push({
                text: match[0],
                type: "recurring",
                startIndex,
                endIndex: startIndex + match[0].length,
              });
            }

            workingText = workingText.replace(match[0], " ");
            break;
          }
        }
      }

      // Parse date using chrono
      const chronoResults = chrono.parse(workingText, new Date(), { forwardDate: true });
      if (chronoResults.length > 0) {
        const chronoResult = chronoResults[0];
        if (!ignoredMatches.has(chronoResult.text.toLowerCase().trim())) {
          result.dueDate = chronoResult.start.date();
          result.dueDateText = chronoResult.text;

          const startIndex = text.indexOf(chronoResult.text);
          if (startIndex !== -1) {
            newSegments.push({
              text: chronoResult.text,
              type: "date",
              startIndex,
              endIndex: startIndex + chronoResult.text.length,
            });
          }

          workingText = workingText.replace(chronoResult.text, " ");
        }
      }

      // The remaining text is the title
      result.title = workingText.replace(/\s+/g, " ").trim();

      // Create text segments for highlighting
      let lastIndex = 0;
      newSegments.sort((a, b) => a.startIndex - b.startIndex);

      const finalSegments: ParsedSegment[] = [];
      newSegments.forEach((segment) => {
        if (segment.startIndex > lastIndex) {
          const textBefore = text.slice(lastIndex, segment.startIndex);
          finalSegments.push({
            text: textBefore,
            type: "text",
            startIndex: lastIndex,
            endIndex: segment.startIndex,
          });
        }
        finalSegments.push(segment);
        lastIndex = segment.endIndex;
      });

      if (lastIndex < text.length) {
        const textAfter = text.slice(lastIndex);
        finalSegments.push({
          text: textAfter,
          type: "text",
          startIndex: lastIndex,
          endIndex: text.length,
        });
      }

      return { task: result, segments: finalSegments };
    },
    [contexts, ignoredMatches],
  );

  // Clean up ignored matches when they're no longer in the input
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIgnoredMatches((prev) => {
      if (prev.size === 0) return prev;

      const lowercaseInput = input.toLowerCase();
      const stillPresent = new Set(
        Array.from(prev).filter((match) => lowercaseInput.includes(match)),
      );

      // Only update if something changed to avoid infinite loops
      if (stillPresent.size !== prev.size) {
        return stillPresent;
      }
      return prev;
    });
  }, [input]);

  // Auto-parse the input (derived state)
  const parseResult = useMemo(() => parseInput(input), [input, parseInput]);

  // Extract segments and task from parse result
  const segments = parseResult.segments;
  const parsedTask: ParsedTask = { ...parseResult.task, ...editOverrides };

  // Check for suggestion triggers and update suggestions
  const updateSuggestions = useCallback(
    (text: string, cursorPos: number) => {
      // Check if we're typing after # or !
      let triggerPos = -1;
      let triggerType: "tag" | "context" | null = null;

      // Find the last # or ! before the cursor
      for (let i = cursorPos - 1; i >= 0; i--) {
        const char = text[i];
        if (char === "#") {
          triggerType = "tag";
          triggerPos = i;
          break;
        } else if (char === "!") {
          triggerType = "context";
          triggerPos = i;
          break;
        } else if (char === " " && triggerType !== "context") {
          // For tags, stop searching at spaces
          // For contexts, continue to support spaces in context names
          break;
        }
      }

      if (triggerType && triggerPos !== -1) {
        const query = text.slice(triggerPos + 1, cursorPos);
        setSuggestionTrigger({
          type: triggerType,
          startPos: triggerPos,
          query,
        });

        // Generate suggestions based on type
        let filteredSuggestions: Suggestion[] = [];

        if (triggerType === "tag") {
          filteredSuggestions = existingTags
            .filter(
              (tag) =>
                tag.toLowerCase().includes(query.toLowerCase()) &&
                !parsedTask.tags.includes(tag) &&
                query.trim() !== "",
            )
            .map((tag) => ({
              text: tag,
              type: "tag" as const,
              displayText: `#${tag}`,
            }));
        } else if (triggerType === "context") {
          // Only show context suggestions if no context has been parsed yet
          if (!parsedTask.contextId && !parsedTask.contextName) {
            filteredSuggestions = contexts
              .filter((context) =>
                context.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((context) => ({
                text: context.name,
                type: "context" as const,
                displayText: `!${context.name}`,
              }));
          }
        }

        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
        setSelectedSuggestionIndex(-1);
      } else {
        setSuggestionTrigger(null);
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
      }
    },
    [
      existingTags,
      contexts,
      parsedTask.tags,
      parsedTask.contextId,
      parsedTask.contextName,
    ],
  );

  // Handle input change with suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Convert tags to lowercase while preserving other text
    const newValue = rawValue.replace(
      /#([a-zA-Z0-9_-]+)/g,
      (match, tagName) => {
        return `#${tagName.toLowerCase()}`;
      },
    );

    setInput(newValue);
    updateSuggestions(newValue, cursorPos);
  };

  // Handle suggestion selection
  const selectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (!suggestionTrigger) return;

      const beforeTrigger = input.substring(0, suggestionTrigger.startPos);
      const afterQuery = input.substring(
        suggestionTrigger.startPos + 1 + suggestionTrigger.query.length,
      );
      const newInput = `${beforeTrigger}${suggestion.displayText} ${afterQuery}`;

      setInput(newInput);
      setShowSuggestions(false);
      setSuggestionTrigger(null);
      setSelectedSuggestionIndex(-1);

      // Focus back to input and position cursor after the suggestion
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos =
            beforeTrigger.length + suggestion.displayText.length + 1;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [input, suggestionTrigger],
  );

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1,
          );
          break;
        case "Enter":
          if (selectedSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedSuggestionIndex]);
            return;
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    }

    // Allow parsed matches to be converted back to title text before editing.
    // Tags are explicit syntax, so Backspace should edit them normally.
    if (e.key === "Backspace" && inputRef.current) {
      const cursorPos = inputRef.current.selectionStart || 0;
      const selectionEnd = inputRef.current.selectionEnd || 0;

      // Only handle when there's no selection (just cursor position)
      if (cursorPos === selectionEnd && cursorPos > 0) {
        // Find if cursor is at the end of a matched segment
        const matchedSegment = segments.find(
          (seg) =>
            seg.type !== "text" &&
            seg.type !== "tag" &&
            seg.endIndex === cursorPos,
        );

        if (matchedSegment) {
          e.preventDefault();
          // Add this match to ignored matches
          const matchText = matchedSegment.text.toLowerCase().trim();
          setIgnoredMatches((prev) => new Set([...prev, matchText]));
        }
      }
    }
  };

  // Handle input cursor position changes
  const handleCursorChange = () => {
    if (inputRef.current) {
      const cursorPos = inputRef.current.selectionStart || 0;
      updateSuggestions(input, cursorPos);
    }
  };

  // Handle input blur to hide suggestions
  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  // Sync scroll position between input and highlight overlay
  const handleScroll = () => {
    if (inputRef.current && highlightRef.current) {
      highlightRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  // Convert parsed task to TaskFormData format
  const getTaskFormData = (): TaskFormData => ({
    title: parsedTask.title,
    priority: parsedTask.priority,
    contextId: parsedTask.contextId || "",
    dueDate: parsedTask.dueDate
      ? `${parsedTask.dueDate.getFullYear()}-${String(parsedTask.dueDate.getMonth() + 1).padStart(2, "0")}-${String(parsedTask.dueDate.getDate()).padStart(2, "0")}`
      : "",
    waitDays: undefined,
    type: parsedTask.type,
    habitType: undefined,
    frequency: parsedTask.frequency,
    tags: parsedTask.tags,
    subtasks: [],
  });

  const handleTaskFormChange = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ) => {
    // Update the edit overrides from form changes
    if (field === "title") {
      setEditOverrides((prev) => ({ ...prev, title: value as string }));
    } else if (field === "priority") {
      setEditOverrides((prev) => ({
        ...prev,
        priority: value as "LOW" | "MEDIUM" | "HIGH",
      }));
    } else if (field === "contextId") {
      const context = contexts.find((c) => c.id === value);
      setEditOverrides((prev) => ({
        ...prev,
        contextId: value as string,
        contextName: context?.name || null,
      }));
    } else if (field === "dueDate") {
      const date = value ? new Date(value as string) : null;
      setEditOverrides((prev) => ({ ...prev, dueDate: date }));
    } else if (field === "tags") {
      setEditOverrides((prev) => ({ ...prev, tags: value as string[] }));
    } else if (field === "frequency") {
      setEditOverrides((prev) => ({
        ...prev,
        frequency: value as number | undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedTask.title.trim()) return;

    // Clear any previous errors
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", parsedTask.title);
      formData.append("priority", parsedTask.priority);

      // Don't use fallback context - let server validation handle missing context
      if (parsedTask.contextId) {
        formData.append("contextId", parsedTask.contextId);
      }

      if (parsedTask.dueDate) {
        formData.append(
          "dueDate",
          parsedTask.dueDate.toISOString().slice(0, 16),
        );
      }
      formData.append("type", parsedTask.type);
      if (parsedTask.frequency) {
        formData.append("frequency", parsedTask.frequency.toString());
      }
      formData.append("tags", parsedTask.tags.join(", "));
      formData.append("notes", parsedTask.notes || "");

      try {
        // Call server action outside of startTransition to properly catch errors
        await createTask(formData);

        // Mark that we should refocus once pending clears
        shouldRefocusAfterSubmitRef.current = true;

        // Use startTransition only for UI state updates after successful submission
        startTransition(() => {
          setInput("");
          setIsEditing(false);
          setError(null);
          setIgnoredMatches(new Set());
          setEditOverrides({});
        });

        onTaskCreated?.();
      } catch (error) {
        console.error("Failed to create task:", error);
        setError(
          error instanceof Error ? error.message : "Failed to create task",
        );
      }
    });
  };

  const renderHighlightedText = () => {
    if (segments.length === 0) {
      return <span className="text-transparent select-none">{input}</span>;
    }

    // Replace spaces with non-breaking spaces
    const segmentsWithNbsp = segments.map((segment) => {
      return {
        ...segment,
        text: segment.text.replace(/\s/g, "\u00A0"),
      };
    });

    return segmentsWithNbsp.map((segment, index) => {
      const colorClass = {
        text: "text-transparent",
        context:
          "bg-blue-500/20 text-transparent rounded px-1 py-0.5 -mx-1 -my-0.5",
        tag: "bg-green-500/20 text-transparent rounded px-1 py-0.5 -mx-1 -my-0.5",
        priority:
          "bg-purple-500/20 text-transparent rounded px-1 py-0.5 -mx-1 -my-0.5",
        date: "bg-orange-500/20 text-transparent rounded px-1 py-0.5 -mx-1 -my-0.5",
        recurring:
          "bg-cyan-500/20 text-transparent rounded px-1 py-0.5 -mx-1 -my-0.5",
      }[segment.type];

      return (
        <span key={index} className={colorClass}>
          {segment.text}
        </span>
      );
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;

    const diffDays = diffInLocalCalendarDays(date);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    if (diffDays < 7) return `In ${diffDays}d`;

    return date.toLocaleDateString();
  };

  console.log(error);

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Smart Input with Inline Highlighting */}
        <div className="relative">
          {/* Highlight overlay - positioned to exactly match input text */}
          <div
            ref={highlightRef}
            className="absolute inset-0 flex text-base leading-6 bg-white dark:bg-gray-900 rounded-md font-mono pointer-events-none overflow-hidden whitespace-nowrap py-3 px-3"
            style={{
              zIndex: 1,
              border: "1px solid transparent", // matches Input border
            }}
          >
            <div className="flex-1 min-w-0">{renderHighlightedText()}</div>
          </div>

          {/* Actual input */}
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onSelect={handleCursorChange}
            onClick={handleCursorChange}
            onBlur={handleInputBlur}
            onFocus={() => setIsInputFocused(true)}
            placeholder="Type your task naturally... e.g., 'Setup unwhelm !Homelab #sideprojects #setup p1 tomorrow' or 'Team standup every week !Work #meetings'"
            className="relative text-base font-mono bg-transparent caret-gray-900 dark:caret-gray-100 pr-8 h-12"
            style={{ zIndex: 2 }}
            disabled={isPending}
          />

          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={!parsedTask.title.trim() || isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            style={{ zIndex: 3 }}
          >
            <Send className="w-4 h-4" />
          </Button>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
              style={{ top: "100%" }}
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}`}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-100 flex items-center gap-2",
                    index === selectedSuggestionIndex &&
                      "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200",
                  )}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  {suggestion.type === "tag" ? (
                    <Hash className="w-3 h-3 text-green-500" />
                  ) : (
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        contexts.find((c) => c.name === suggestion.text)
                          ?.color ?? "bg-blue-500",
                      )}
                    />
                  )}
                  <span className="font-mono">{suggestion.displayText}</span>
                  {suggestion.type === "context" && (
                    <span className="text-xs text-gray-500 ml-auto">
                      context
                    </span>
                  )}
                  {suggestion.type === "tag" && (
                    <span className="text-xs text-gray-500 ml-auto">tag</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Task Preview with Editable Form */}
        {(parsedTask.title ||
          parsedTask.contextName ||
          parsedTask.tags.length > 0 ||
          parsedTask.priority !== "MEDIUM" ||
          parsedTask.dueDate ||
          parsedTask.type === "RECURRING") && (
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4" />
                Task Preview
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    // Clear edit overrides when exiting edit mode
                    setEditOverrides({});
                  }
                  setIsEditing(!isEditing);
                }}
                className="h-6 px-2 text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                {isEditing ? "Done" : "Edit"}
              </Button>
            </div>

            {/* Use TaskForm component in edit mode, simple display in view mode */}
            {isEditing ? (
              <TaskForm
                data={getTaskFormData()}
                onChange={handleTaskFormChange}
                contexts={contexts}
                compact={true}
                fieldIdPrefix="smart-input"
                errors={
                  error
                    ? {
                        // Context is no longer required since we have inbox fallback
                      }
                    : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Title</div>
                  <div className="text-sm font-medium">
                    {parsedTask.title || (
                      <span className="text-gray-400">No title</span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Priority</div>
                  <div className="text-sm">
                    <Badge className={getPriorityColor(parsedTask.priority)}>
                      {parsedTask.priority}
                    </Badge>
                  </div>
                </div>

                {/* Context */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Context</div>
                  <div className="text-sm">
                    {parsedTask.contextName && parsedTask.contextId ? (
                      (() => {
                        const matchedContext = contexts.find(
                          (c) => c.id === parsedTask.contextId,
                        );
                        if (matchedContext) {
                          const ContextIconComponent = getContextIconComponent(
                            matchedContext.icon,
                          );
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white mb-1",
                                matchedContext.color,
                              )}
                              title={matchedContext.name}
                            >
                              <ContextIconComponent className="w-3 h-3 mr-1" />
                              {matchedContext.name}
                            </span>
                          );
                        }
                        return (
                          <Badge
                            variant="outline"
                            className="text-red-600 bg-red-50 border-red-200"
                          >
                            {parsedTask.contextName} (not found)
                          </Badge>
                        );
                      })()
                    ) : parsedTask.contextName ? (
                      <Badge
                        variant="outline"
                        className="text-red-600 bg-red-50 border-red-200"
                      >
                        {parsedTask.contextName} (not found)
                      </Badge>
                    ) : (
                      (() => {
                        const inboxContext = contexts.find((c) => c.isInbox);
                        if (inboxContext) {
                          const ContextIconComponent = getContextIconComponent(
                            inboxContext.icon,
                          );
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white mb-1",
                                inboxContext.color,
                              )}
                              title={`${inboxContext.name} (default)`}
                            >
                              <ContextIconComponent className="w-3 h-3 mr-1" />
                              {inboxContext.name} (default)
                            </span>
                          );
                        }
                        return (
                          <span className="text-red-400">
                            No context available
                          </span>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Due Date</div>
                  <div className="text-sm">
                    {parsedTask.dueDate ? (
                      <Badge
                        variant="outline"
                        className="text-orange-600 bg-orange-50 border-orange-200"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(parsedTask.dueDate)}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </div>
                </div>

                {/* Recurring Info */}
                {parsedTask.type === "RECURRING" && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Recurring</div>
                    <div className="text-sm">
                      <Badge
                        variant="outline"
                        className="text-cyan-600 bg-cyan-50 border-cyan-200"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {parsedTask.recurringText} ({parsedTask.frequency} days)
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {parsedTask.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {parsedTask.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-green-600 bg-green-50 border-green-200"
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Help Text */}
      {isInputFocused && (
        <div className="text-xs text-gray-500 mt-2">
          <div className="font-medium mb-1">Quick syntax:</div>
          <div className="space-y-1">
            <div>
              <code className="bg-blue-50 text-blue-600 px-1 rounded">
                !context
              </code>{" "}
              for context{" "}
              <span className="text-gray-400">(type ! to see suggestions)</span>
            </div>
            <div>
              <code className="bg-green-50 text-green-600 px-1 rounded">
                #tag
              </code>{" "}
              for tags{" "}
              <span className="text-gray-400">(type # to see suggestions)</span>
            </div>
            <div>
              <code className="bg-purple-50 text-purple-600 px-1 rounded">
                p1/p2/p3
              </code>{" "}
              for priority (high/medium/low)
            </div>
            <div>
              <code className="bg-orange-50 text-orange-600 px-1 rounded">
                tomorrow, next week, in 3 days
              </code>{" "}
              for due dates
            </div>
            <div>
              <code className="bg-cyan-50 text-cyan-600 px-1 rounded">
                daily, weekly, every day, every week, every 4 days
              </code>{" "}
              for recurring tasks
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
