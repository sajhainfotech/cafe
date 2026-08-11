"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button, { IconButton } from "./Button";

const WIDTHS = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
};

/**
 * Centred dialog. Closes on Esc and on backdrop click, locks body scroll while
 * open, and moves focus to the first field inside so keyboard users land in the
 * right place.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
  className,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);

  /*
   * Callers pass an inline arrow for onClose, so its identity changes on every
   * render. Keeping it in a ref lets the effects below depend on `open` alone.
   *
   * They used to list `onClose` as a dependency, which meant every keystroke in
   * a form re-ran them — and re-running the autofocus threw the caret back to
   * the first field after a single character.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Esc to close, and lock background scroll for as long as we're open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Autofocus, once per opening — never again while the user is typing.
  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector(
        "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])",
      );
      (target ?? panelRef.current)?.focus?.();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/45 animate-fade-in"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={cn(
          "w-full bg-white rounded-xl shadow-pop border border-ink-200",
          "flex flex-col max-h-[90vh] animate-pop-in outline-none",
          WIDTHS[size] ?? WIDTHS.md,
          className,
        )}
      >
        {title && (
          <header className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-ink-200">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-ink-900 truncate">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-ink-500 mt-0.5">{description}</p>
              )}
            </div>
            <IconButton
              icon={X}
              label="Close dialog"
              size="sm"
              onClick={onClose}
              className="-mr-1.5 -mt-0.5 hover:text-danger-600"
            />
          </header>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-5 py-4">
          {children}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-ink-200 bg-ink-50 rounded-b-xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation for an action that can't be walked back.
 *
 * `tone` picks the confirm button: "danger" for deletions, "primary" for
 * irreversible-but-not-destructive steps like settling a bill, which shouldn't
 * be painted red.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm delete",
  itemName,
  message,
  confirmLabel = "Delete",
  tone = "danger",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">
        {message ?? (
          <>
            This will permanently delete{" "}
            <span className="font-semibold text-ink-900">
              {itemName || "this item"}
            </span>
            . This can&apos;t be undone.
          </>
        )}
      </p>
    </Modal>
  );
}
