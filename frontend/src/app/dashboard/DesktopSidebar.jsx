"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useSidebar } from "./SidebarContext";
import { getHomeRoute, getNavGroups } from "./navigation";

/**
 * Sidebar for both breakpoints: a collapsible rail on lg+, an overlay drawer
 * below it.
 *
 * Surface is near-black (ink-900) rather than dark green. Green-on-green left
 * the active and hover states nothing to work with — brand-800 against
 * brand-700 is barely a visible change. On a neutral surface the brand green
 * becomes the active indicator, which is the strongest signal available.
 */
export default function DesktopSidebar({ is_superuser }) {
  const { railCollapsed, toggleRail, mobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();
  const { restaurant } = useAccount();

  const isSuperUser = is_superuser === true || is_superuser === "true";
  const groups = getNavGroups(isSuperUser);
  const roleLabel = isSuperUser ? "Super Admin" : "Staff Panel";
  const homeRoute = getHomeRoute(isSuperUser);

  // Superusers aren't scoped to one restaurant, so login stores no name for
  // them — fall back to the product name.
  const brandName = restaurant || "Cafe";

  return (
    <>
      {/* ---------- Desktop rail ---------- */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-ink-900 text-ink-200 lg:flex",
          "border-r border-ink-800 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          railCollapsed ? "w-16" : "w-60",
        )}
      >
        <Brand
          collapsed={railCollapsed}
          roleLabel={roleLabel}
          name={brandName}
          href={homeRoute}
        />

        <Nav
          groups={groups}
          pathname={pathname}
          collapsed={railCollapsed}
          className="flex-1 overflow-y-auto scrollbar-hide"
        />

        <button
          type="button"
          onClick={toggleRail}
          aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "group flex items-center gap-2.5 border-t border-ink-800 px-4 py-3",
            "cursor-pointer text-2xs font-semibold text-ink-400",
            "transition-colors hover:bg-white/5 hover:text-white",
            railCollapsed && "justify-center px-0",
          )}
        >
          {railCollapsed ? (
            <PanelLeftOpen
              className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          ) : (
            <>
              <PanelLeftClose
                className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              Collapse
            </>
          )}
        </button>
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={closeMobile}
            className="absolute inset-0 animate-fade-in bg-ink-900/60"
          />

          <aside className="absolute left-0 top-0 flex h-full w-64 animate-slide-in-left flex-col bg-ink-900 text-ink-200 shadow-pop">
            <div className="flex items-center justify-between border-b border-ink-800 pr-2">
              <Brand
                collapsed={false}
                roleLabel={roleLabel}
                name={brandName}
                href={homeRoute}
                onNavigate={closeMobile}
                // Row parent here, so a long name truncates instead of pushing
                // the close button off the edge.
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
                className="cursor-pointer rounded-md p-2 text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <Nav
              groups={groups}
              pathname={pathname}
              collapsed={false}
              onNavigate={closeMobile}
              className="flex-1 overflow-y-auto scrollbar-hide"
            />
          </aside>
        </div>
      )}
    </>
  );
}

/**
 * The restaurant this account belongs to, taken from the login response, and a
 * link back to the role's home screen.
 */
function Brand({ collapsed, roleLabel, name, href, onNavigate, className }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? name : undefined}
      aria-label={`${name} — go to home`}
      className={cn(
        // shrink-0, and no flex-1 here: the desktop rail is a flex COLUMN, so
        // flex-1 would override h-14 and stretch this block down the sidebar.
        // The drawer passes flex-1 itself, where the parent is a row.
        "group flex h-14 shrink-0 items-center gap-2.5 px-4 transition-colors hover:bg-white/5",
        collapsed && "justify-center px-0",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white",
          "transition-transform duration-200 group-hover:scale-105",
        )}
      >
        <UtensilsCrossed className="size-4" aria-hidden="true" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-white">
            {name}
          </p>
          <p className="truncate text-2xs text-ink-400">{roleLabel}</p>
        </div>
      )}
    </Link>
  );
}

/**
 * Navigation with a single active pill that slides between items.
 *
 * One shared element is measured against the active link and moved with a
 * transform, rather than each item fading its own background in and out — the
 * movement is what tells you where you came from and where you landed.
 */
function Nav({ groups, pathname, collapsed, onNavigate, className }) {
  const navRef = useRef(null);
  const [pill, setPill] = useState(null);
  // Skip the transition on the very first paint, or the pill slides in from the
  // top of the sidebar on every page load.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      const active = nav?.querySelector('[data-active="true"]');
      if (!nav || !active) {
        setPill(null);
        return;
      }
      setPill({ top: active.offsetTop, height: active.offsetHeight });
    };

    measure();
    const frame = requestAnimationFrame(() => setArmed(true));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [pathname, collapsed, groups]);

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className={cn("relative py-3", className)}
    >
      {pill && (
        <span
          aria-hidden="true"
          style={{
            transform: `translateY(${pill.top}px)`,
            height: pill.height,
          }}
          className={cn(
            "pointer-events-none absolute left-2 right-2 top-0 rounded-md bg-brand-600 shadow-card",
            armed &&
              "transition-[transform,height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          )}
        />
      )}

      {groups.map((group) => (
        <div key={group.group} className="mb-4 last:mb-0">
          {!collapsed && (
            <p className="px-4 pb-1.5 text-2xs font-bold uppercase tracking-wider text-ink-500">
              {group.group}
            </p>
          )}

          <ul className="space-y-0.5 px-2">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.route;

              return (
                <li key={item.route}>
                  <Link
                    href={item.route}
                    onClick={onNavigate}
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      // relative + z-10 keeps the label above the sliding pill.
                      "group relative z-10 flex items-center gap-2.5 rounded-md px-2.5 py-2",
                      "text-sm font-medium transition-colors duration-200",
                      collapsed && "justify-center px-0",
                      active
                        ? "font-semibold text-white"
                        : "text-ink-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200",
                        !active && "group-hover:scale-110",
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
