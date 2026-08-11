"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standard padding and vertical rhythm for a dashboard page.
 *
 * Deliberately NOT min-h-screen: the dashboard layout's <main> is the scroll
 * container, so a full-viewport child here produced a second scrollbar on
 * every page.
 */
export default function PageShell({ className, children }) {
  return (
    <div className={cn("p-4 md:p-6 space-y-4", className)}>{children}</div>
  );
}

/**
 * Page title on the left, search + primary action on the right. Collapses to
 * stacked rows on mobile, where the search field goes full width.
 */
export function PageHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  action,
  children,
  className,
}) {
  const hasSearch = typeof onSearchChange === "function";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-bold tracking-tight text-ink-900">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
        {children}
        {hasSearch && (
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
        {action}
      </div>
    </div>
  );
}

export function SearchInput({
  value = "",
  onChange,
  placeholder = "Search…",
  className,
}) {
  return (
    <div className={cn("relative sm:w-60", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 rounded-md border border-ink-300 bg-white",
          "pl-8 pr-8 text-sm text-ink-900 placeholder:text-ink-400",
          "transition-colors hover:border-ink-400 focus:border-brand-500",
          // Chrome's native search clear button duplicates ours
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-700 cursor-pointer"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Horizontal segmented filter, e.g. Today / Week / All on the order screen. */
export function SegmentedControl({ value, onChange, options, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-ink-200 bg-ink-50 p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-7 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap",
              active
                ? "bg-white text-brand-700 shadow-card"
                : "text-ink-500 hover:text-ink-800",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
