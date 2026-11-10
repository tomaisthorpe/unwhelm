import type { Context, Task } from "./data";

const priorities: Record<string, Task["priority"]> = {
  p1: "HIGH",
  p2: "MEDIUM",
  p3: "LOW",
};

export function parseTaskSearch(query: string) {
  const selectedPriorities: Task["priority"][] = [];
  const text = query.toLowerCase().trim().split(/\s+/).filter((token) => {
    if (!Object.hasOwn(priorities, token)) return true;
    selectedPriorities.push(priorities[token]);
    return false;
  }).join(" ");

  return { text, priorities: selectedPriorities };
}

export function matchesContextSearch(
  context: Pick<Context, "name"> & Partial<Pick<Context, "description">>,
  text: string,
) {
  return context.name.toLowerCase().includes(text) ||
    Boolean(context.description?.toLowerCase().includes(text));
}

export function matchesTaskSearch(
  task: Pick<Task, "title" | "notes" | "tags" | "priority">,
  search: ReturnType<typeof parseTaskSearch>,
  context?: Pick<Context, "name"> & Partial<Pick<Context, "description">>,
) {
  if (search.priorities.length > 0 && !search.priorities.includes(task.priority)) {
    return false;
  }
  const { text } = search;
  if (!text) return true;
  const tagText = text.replace(/^#+/, "");
  return task.title.toLowerCase().includes(text) ||
    Boolean(task.notes?.toLowerCase().includes(text)) ||
    (tagText.length > 0 && task.tags.some((tag) => tag.toLowerCase().includes(tagText))) ||
    Boolean(context && matchesContextSearch(context, text));
}
