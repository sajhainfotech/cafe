"use client";

import { cn } from "@/lib/utils";

export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded bg-ink-100 animate-pulse", className)}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
