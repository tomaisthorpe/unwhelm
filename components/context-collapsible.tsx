"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleContextType {
  isCollapsed: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null);

export function useCollapsible() {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error("useCollapsible must be used within ContextCollapsible");
  }
  return context;
}

interface ContextCollapsibleProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  // When provided, the component becomes controlled
  collapsed?: boolean;
  onCollapsedChange?: (value: boolean) => void;
}

export function ContextCollapsible({
  children,
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
}: ContextCollapsibleProps) {
  const isControlled = typeof collapsed === "boolean";
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  const currentCollapsed = isControlled
    ? (collapsed as boolean)
    : internalCollapsed;

  const toggle = () => {
    if (isControlled) {
      onCollapsedChange?.(!currentCollapsed);
    } else {
      setInternalCollapsed(!currentCollapsed);
    }
  };

  return (
    <CollapsibleContext.Provider
      value={{ isCollapsed: currentCollapsed, toggle }}
    >
      {children}
    </CollapsibleContext.Provider>
  );
}

interface ContentProps {
  children: ReactNode;
}

export function ContextCollapsibleContent({ children }: ContentProps) {
  const { isCollapsed } = useCollapsible();

  if (isCollapsed) return null;

  return <>{children}</>;
}

interface TriggerProps {
  children?: ReactNode;
}

export function ContextCollapsibleTrigger({ children }: TriggerProps) {
  const { isCollapsed, toggle } = useCollapsible();

  return (
    <div
      onClick={toggle}
      onKeyDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={!isCollapsed}
      className="w-full flex items-center justify-center rounded transition-colors cursor-pointer"
    >
      {children || (
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isCollapsed ? "-rotate-90" : "rotate-0"
          }`}
        />
      )}
    </div>
  );
}
