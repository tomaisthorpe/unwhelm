"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onTagClick?: (tagName: string) => void;
}

export function TagsInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = "Add tags...",
  className,
  disabled = false,
  onTagClick,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input value
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion) &&
      inputValue.trim() !== "",
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase();
    setInputValue(newValue);
    setShowSuggestions(newValue.trim().length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case ",":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && filteredSuggestions.length > 0) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;
      case "Backspace":
        if (!inputValue && value.length > 0) {
          removeTag(value.length - 1);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Add a tag
  const addTag = (tag: string) => {
    const lowercaseTag = tag.toLowerCase();
    if (lowercaseTag && !value.includes(lowercaseTag)) {
      onChange([...value, lowercaseTag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Remove a tag
  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  // Handle tag click
  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  // Handle input focus
  const handleFocus = () => {
    if (inputValue.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md min-h-[2.5rem] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {value.map((tag, index) => (
          <span
            key={index}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md",
              onTagClick &&
                "cursor-pointer hover:bg-blue-200 transition-colors",
            )}
            onClick={onTagClick ? (e) => handleTagClick(tag, e) : undefined}
            title={onTagClick ? "Click to edit tag coefficient" : undefined}
          >
            {onTagClick && <Edit2 className="w-3 h-3 opacity-60" />}
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeTag(index);
              }}
              className="ml-1 hover:bg-blue-200 rounded-sm p-0.5 transition-colors"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[120px] border-none outline-none focus:ring-0 p-0 bg-transparent shadow-none"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm",
                index === selectedSuggestionIndex
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-100",
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
