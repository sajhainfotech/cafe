"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Searchable single-select. Replaces antd's <Select showSearch allowClear>.
 *
 * Options: [{ value, label }]. Fully keyboard operable — type to filter,
 * ↑/↓ to move, Enter to pick, Esc to close.
 *
 * The panel renders in a portal with fixed positioning, so it can't be clipped
 * by an ancestor's `overflow` — which is what made the old antd selects unusable
 * inside the menu form's horizontally-scrolling table. It flips above the
 * trigger when there isn't room below.
 */
export default function SearchSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  allowClear = true,
  disabled = false,
  invalid = false,
  emptyMessage = "No matches",
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);

  const listboxId = `${useId()}-listbox`;

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query]);

  // Measure the trigger and keep the panel pinned to it while the page moves.
  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const PANEL_MAX = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = spaceBelow < PANEL_MAX && rect.top > spaceBelow;

      setPosition({
        left: rect.left,
        width: rect.width,
        ...(flipUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        maxHeight: Math.min(PANEL_MAX, (flipUp ? rect.top : spaceBelow) - 12),
      });
    };

    measure();
    // `true` captures scrolls inside any ancestor, not just the window.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // Close on outside click — the panel is portalled, so check it separately.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const selectedIndex = filtered.findIndex((o) => o.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted option in view as the user arrows through.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const commit = (option) => {
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[activeIndex]) commit(filtered[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const panel =
    open && position ? (
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          left: position.left,
          width: position.width,
          top: position.top,
          bottom: position.bottom,
          zIndex: 70,
        }}
        className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop animate-pop-in"
      >
        <div className="relative border-b border-ink-100 p-2">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 w-full rounded-md bg-ink-50 pl-7 pr-2 text-sm text-ink-900 placeholder:text-ink-400 focus:bg-white focus:outline-1 focus:outline-brand-500"
          />
        </div>

        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          style={{ maxHeight: position.maxHeight }}
          className="overflow-y-auto scrollbar-slim p-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-ink-400">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(option)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                    isActive && "bg-brand-50",
                    isSelected ? "font-semibold text-brand-700" : "text-ink-700",
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <Check
                      className="size-3.5 shrink-0 text-brand-600"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-md border bg-white px-2.5 text-sm",
          "transition-colors",
          disabled
            ? "cursor-not-allowed bg-ink-50 text-ink-400"
            : "cursor-pointer",
          invalid
            ? "border-danger-600"
            : "border-ink-300 hover:border-ink-400 aria-expanded:border-brand-500",
          className,
        )}
      >
        <span
          className={cn(
            "flex-1 truncate text-left",
            selected ? "text-ink-900" : "text-ink-400",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>

        {allowClear && selected && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.("");
            }}
            className="rounded p-0.5 text-ink-400 hover:text-danger-600 cursor-pointer"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </div>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
