"use client";

import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-ink-100 text-ink-600 border-ink-200",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-success-50 text-success-700 border-success-200",
  warning: "bg-warning-50 text-warning-700 border-warning-200",
  danger: "bg-danger-50 text-danger-700 border-danger-200",
  info: "bg-info-50 text-info-700 border-info-200",
};

const DOTS = {
  neutral: "bg-ink-400",
  brand: "bg-brand-500",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
  info: "bg-info-600",
};

export default function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-2xs font-semibold whitespace-nowrap",
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", DOTS[tone] ?? DOTS.neutral)}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Order lifecycle → badge tone. One place, so Pending is the same amber
 * everywhere it appears.
 */
export const ORDER_STATUS_TONE = {
  pending: "warning",
  preparing: "info",
  ready: "brand",
  served: "success",
  paid: "success",
  cancelled: "danger",
};

export function StatusBadge({ status, className }) {
  const key = String(status ?? "").toLowerCase();
  const label = key ? key[0].toUpperCase() + key.slice(1) : "Unknown";
  return (
    <Badge tone={ORDER_STATUS_TONE[key] ?? "neutral"} dot className={className}>
      {label}
    </Badge>
  );
}
