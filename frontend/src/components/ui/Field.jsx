"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const CONTROL_BASE =
  "w-full bg-white text-ink-900 border rounded-md transition-colors duration-150 " +
  "placeholder:text-ink-400 disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed";

const controlTone = (invalid) =>
  invalid
    ? "border-danger-600 focus:border-danger-600"
    : "border-ink-300 hover:border-ink-400 focus:border-brand-500";

/**
 * Label + control + error/hint wrapper. Wires htmlFor/id/aria-describedby so
 * screen readers and click-to-focus both work.
 *
 *   <Field label="Name" required error={errors.name}>
 *     {(p) => <Input {...p} value={name} onChange={…} />}
 *   </Field>
 */
export function Field({
  label,
  required = false,
  error,
  hint,
  className,
  children,
  htmlFor,
}) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const controlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    invalid: Boolean(error),
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-ink-700"
        >
          {label}
          {required && (
            <span className="text-danger-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {typeof children === "function" ? children(controlProps) : children}

      {error ? (
        <p id={`${id}-error`} className="text-2xs font-medium text-danger-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-2xs text-ink-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({ invalid, className, ...props }) {
  return (
    <input
      className={cn(
        CONTROL_BASE,
        controlTone(invalid),
        "h-9 px-3 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ invalid, className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        CONTROL_BASE,
        controlTone(invalid),
        "px-3 py-2 text-sm resize-y min-h-20",
        className,
      )}
      {...props}
    />
  );
}

/** Native select — use for short, fixed option lists. */
export function Select({ invalid, className, children, ...props }) {
  return (
    <select
      className={cn(
        CONTROL_BASE,
        controlTone(invalid),
        "h-9 pl-3 pr-8 text-sm cursor-pointer appearance-none",
        // caret
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b766f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
        "bg-[length:16px] bg-[right_0.625rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/** Character counter for textareas with a max length. */
export function CharCount({ value = "", max, className }) {
  const len = value?.length ?? 0;
  if (!len) return null;
  const near = len > max * 0.9;
  return (
    <p
      className={cn(
        "text-2xs text-right",
        near ? "text-warning-600 font-medium" : "text-ink-400",
        className,
      )}
    >
      {len}/{max}
    </p>
  );
}
