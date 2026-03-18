import { ReactNode } from "react";

interface SectionPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionPanel({ title, description, children }: SectionPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      <div className={description ? "" : "mt-3"}>{children}</div>
    </div>
  );
}
