"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown when a list has nothing in it. Distinguishes "nothing exists yet"
 * (offer the create action) from "your search matched nothing" (offer a reset),
 * because those need different responses from the user.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-14",
        className,
      )}
    >
      <div className="rounded-full bg-ink-100 p-3">
        <Icon className="size-6 text-ink-400" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-800">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-ink-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
