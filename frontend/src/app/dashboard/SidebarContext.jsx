"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext(null);

const STORAGE_KEY = "sidebar:collapsed";

/**
 * Two independent pieces of state, which the previous single `collapsed` flag
 * conflated:
 *
 *   railCollapsed — desktop rail is icons-only (persisted across sessions)
 *   mobileOpen    — mobile drawer is showing (never persisted)
 *
 * Both start at a fixed value so the server and client render the same markup;
 * the stored desktop preference is applied after mount.
 */
export function SidebarProvider({ children }) {
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // Deliberate: localStorage doesn't exist on the server, so the stored
      // preference can only be applied after mount without a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved !== null) setRailCollapsed(saved === "true");
    } catch {
      // localStorage unavailable (private mode) — keep the default.
    }
  }, []);

  const toggleRail = () =>
    setRailCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Preference just won't persist.
      }
      return next;
    });

  return (
    <SidebarContext.Provider
      value={{
        railCollapsed,
        toggleRail,
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside <SidebarProvider>");
  }
  return context;
}
