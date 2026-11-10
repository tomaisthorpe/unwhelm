"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ContextIcon, contextIconOptions } from "@/lib/context-icons";

export function ContextIconPicker({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = contextIconOptions.find((option) => option.value === value);
  const search = query.trim().toLowerCase();
  const options = contextIconOptions.filter((option) =>
    `${option.label} ${option.value}`.toLowerCase().includes(search),
  );

  useLayoutEffect(() => {
    if (!open) return;
    const popup = popupRef.current;
    if (!popup) return;
    // The browser's top layer keeps the picker outside the dialog's scroll clipping.
    popup.showPopover();
    function positionPopup() {
      if (!popup || !triggerRef.current) return;
      const trigger = triggerRef.current.getBoundingClientRect();
      popup.style.maxHeight = `${window.innerHeight - 16}px`;
      popup.style.left = `${Math.max(8, Math.min(trigger.left, window.innerWidth - popup.offsetWidth - 8))}px`;
      const below = window.innerHeight - trigger.bottom - 8;
      const above = trigger.top - 8;
      const top = below >= popup.offsetHeight || below >= above
        ? Math.min(trigger.bottom + 4, window.innerHeight - popup.offsetHeight - 8)
        : trigger.top - popup.offsetHeight - 4;
      popup.style.top = `${Math.max(8, top)}px`;
    }
    positionPopup();
    window.addEventListener("resize", positionPopup);
    window.addEventListener("scroll", positionPopup, true);
    return () => {
      window.removeEventListener("resize", positionPopup);
      window.removeEventListener("scroll", positionPopup, true);
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = document.getElementById(listId);
    const item = document.getElementById(`${listId}-${activeIndex}`);
    if (!list || !item) return;
    // Scroll only the icon grid; scrollIntoView also scrolls the surrounding modal.
    const listBounds = list.getBoundingClientRect();
    const itemBounds = item.getBoundingClientRect();
    if (itemBounds.top < listBounds.top) {
      list.scrollTop -= listBounds.top - itemBounds.top;
    } else if (itemBounds.bottom > listBounds.bottom) {
      list.scrollTop += itemBounds.bottom - listBounds.bottom;
    }
  }, [open, activeIndex, listId, search]);

  function selectIcon(icon: string) {
    onValueChange(icon);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-white dark:bg-input/30 px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
        onClick={() => {
          setQuery("");
          setHoveredIndex(null);
          setActiveIndex(Math.max(0, contextIconOptions.findIndex((option) => option.value === value)));
          setOpen(!open);
        }}
      >
        <span>
          <ContextIcon iconName={value} className="inline mr-2 h-4 w-4" />
          {selected?.label ?? value}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div ref={popupRef} popover="manual" data-context-icon-picker className="fixed inset-auto m-0 flex w-64 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-md border border-input bg-white text-foreground shadow-md dark:bg-gray-900">
          <div className="shrink-0 border-b border-input p-1">
            <Input
              autoFocus
              role="combobox"
              aria-label="Search icons"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
              placeholder="Search icons…"
              className="rounded-none border-0 bg-transparent px-2 shadow-none dark:bg-transparent"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
                setHoveredIndex(null);
              }}
              onKeyDown={(event) => {
                const steps: Record<string, number> = {
                  ArrowDown: 6,
                  ArrowUp: -6,
                  ArrowRight: 1,
                  ArrowLeft: -1,
                };
                if (event.key in steps) {
                  event.preventDefault();
                  setHoveredIndex(null);
                  setActiveIndex((index) => Math.max(0, Math.min(options.length - 1, index + steps[event.key])));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  if (options[activeIndex]) selectIcon(options[activeIndex].value);
                }
              }}
            />
          </div>
          <div
            id={listId}
            role="listbox"
            aria-label="Context icons"
            className="grid min-h-0 max-h-60 grid-cols-6 gap-1 overflow-y-auto p-2"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {options.map(({ value: iconValue, icon: Icon, label }, index) => (
              <button
                key={iconValue}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-label={label}
                aria-selected={value === iconValue}
                tabIndex={-1}
                className={`flex h-9 w-full cursor-pointer items-center justify-center rounded-md outline-none transition-colors ${value === iconValue ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"} ${index === activeIndex ? "ring-1 ring-inset ring-ring" : ""}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectIcon(iconValue)}
              >
                <Icon aria-hidden="true" className="h-5 w-5 stroke-[1.5]" />
              </button>
            ))}
            {options.length === 0 && (
              <p role="status" className="col-span-6 px-2 py-3 text-sm text-muted-foreground">No icons found.</p>
            )}
          </div>
          {options.length > 0 && (
            <div className="shrink-0 border-t border-input px-3 py-2 text-xs text-muted-foreground">
              {options[hoveredIndex ?? activeIndex]?.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
