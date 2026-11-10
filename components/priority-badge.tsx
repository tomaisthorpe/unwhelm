import { HighlightedText } from "@/components/ui/highlighted-text";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH";
  highlighted?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  highlighted = false,
  className,
}: PriorityBadgeProps) {
  const label = priority === "HIGH"
    ? "↑ High"
    : priority === "LOW" ? "↓ Low" : "Medium";

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
        priority === "HIGH"
          ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
        className,
      )}
    >
      <HighlightedText
        text={label}
        searchQuery={highlighted ? label : undefined}
      />
    </span>
  );
}
