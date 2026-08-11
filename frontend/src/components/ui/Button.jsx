"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-card hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-ink-700 border border-ink-300 shadow-card hover:bg-ink-50 hover:border-ink-400",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  // Table row actions: coloured at rest, not only on hover, so edit and delete
  // are distinguishable at a glance while scanning a column of rows.
  "ghost-brand": "text-brand-600 hover:bg-brand-50 hover:text-brand-700",
  "ghost-danger": "text-danger-600 hover:bg-danger-50 hover:text-danger-700",
  danger: "bg-danger-600 text-white shadow-card hover:bg-danger-700",
  "danger-quiet":
    "bg-danger-50 text-danger-700 border border-danger-200 hover:bg-danger-100",
  link: "text-brand-600 hover:text-brand-700 underline underline-offset-2 px-0",
};

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  type = "button",
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap",
        "transition-colors duration-150 cursor-pointer select-none",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-4" aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Square icon-only button. `label` is required — it becomes the accessible
 * name and the tooltip, since there is no visible text.
 */
export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  ...props
}) {
  const box = size === "sm" ? "size-7" : "size-9";
  const glyph = size === "sm" ? "size-3.5" : "size-4";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "transition-colors duration-150 cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant] ?? VARIANTS.ghost,
        box,
        className,
      )}
      {...props}
    >
      <Icon className={glyph} aria-hidden="true" />
    </button>
  );
}
