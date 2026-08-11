"use client";

import { BarChart3 } from "lucide-react";
import { useMounted } from "@/lib/useMounted";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Card + title + fixed-height plot area for a single chart.
 *
 * Holds the height so the chart can't collapse, keeps the skeleton exactly the
 * same height as the chart (no layout jump on mount), and shows an empty state
 * instead of empty axes when there's no data yet.
 */
export default function ChartPanel({
  title,
  subtitle,
  height = 280,
  hasData = true,
  emptyMessage = "No data for this period yet.",
  children,
}) {
  const mounted = useMounted();

  return (
    <section className="bg-white border border-ink-200 rounded-xl shadow-card overflow-hidden">
      <header className="px-5 pt-4 pb-3">
        <h2 className="text-sm font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </header>

      <div style={{ height }} className="px-2 pb-3">
        {!hasData ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing to chart"
            description={emptyMessage}
            className="h-full py-0"
          />
        ) : !mounted ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-ink-50" />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Shared tooltip so both panels label and format identically. */
export function ChartTooltip({ active, payload, label, rows = [] }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-2xs font-bold uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <dl className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-ink-500">{row.label}</dt>
            <dd className="text-xs font-bold text-ink-900 tabular-nums">
              {row.format ? row.format(point[row.key]) : (point[row.key] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
