"use client";

import { cn } from "@/lib/utils";

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white border border-ink-200 rounded-xl shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 border-b border-ink-200",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

/**
 * Metric tile. The number is the loudest thing in it; the label is quiet.
 * `tone` tints only the icon chip so a row of tiles still reads as one set.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "brand",
  loading = false,
  className,
}) {
  const chip = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
    info: "bg-info-50 text-info-600",
  }[tone];

  return (
    <div
      className={cn(
        "bg-white border border-ink-200 rounded-xl shadow-card p-4",
        "transition-shadow duration-150 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
          {label}
        </p>
        {Icon && (
          <div className={cn("rounded-lg p-1.5 shrink-0", chip)}>
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-2 h-7 w-24 rounded bg-ink-100 animate-pulse" />
      ) : (
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 tabular-nums">
          {value}
        </p>
      )}

      {hint && <p className="mt-1 text-2xs text-ink-500">{hint}</p>}
    </div>
  );
}

/** Section label with a hairline, for grouping tiles on the dashboard. */
export function SectionLabel({ children, className }) {
  return (
    <h2
      className={cn(
        "flex items-center gap-3 text-2xs font-bold uppercase tracking-wider text-ink-500",
        className,
      )}
    >
      {children}
      <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
    </h2>
  );
}
