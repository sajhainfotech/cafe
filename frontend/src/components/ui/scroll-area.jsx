"use client";

export function ScrollArea({ children, className, ...props }) {
  return (
    <div
      className={`overflow-auto h-full w-full ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
