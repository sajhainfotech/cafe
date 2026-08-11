import {
  Boxes,
  Building2,
  GaugeCircle,
  ShoppingCart,
  SquareMenu,
  Store,
  Table,
  Tag,
  UserCog,
  Users,
} from "lucide-react";

/**
 * Single source of truth for dashboard navigation.
 *
 * The sidebar renders these groups and AdminHeader derives the current page
 * title from the same list, so a renamed screen can't end up with two
 * different names in two places.
 */

/**
 * Ordered as the setup flow runs, so the sidebar reads top-to-bottom the way a
 * new branch is actually configured:
 *
 *   Catalog     units → categories → menu   (each step depends on the one above)
 *   Operations  tables → orders             (a table's QR is what produces orders)
 */
export const STAFF_NAV = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", route: "/dashboard", icon: GaugeCircle }],
  },
  {
    group: "Catalog",
    items: [
      { label: "Units", route: "/dashboard/unit", icon: Boxes },
      { label: "Categories", route: "/dashboard/category", icon: Tag },
      { label: "Menu", route: "/dashboard/menu", icon: SquareMenu },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Tables", route: "/dashboard/table-management", icon: Table },
      { label: "Orders", route: "/dashboard/order", icon: ShoppingCart },
    ],
  },
];

export const SUPERUSER_NAV = [
  {
    group: "Manage",
    items: [
      { label: "Restaurants", route: "/dashboard/restaurant", icon: Store },
      { label: "Branches", route: "/dashboard/branche", icon: Building2 },
      { label: "Users", route: "/dashboard/all-user", icon: Users },
    ],
  },
];

/** Routes not shown in the sidebar but which still need a header title. */
const EXTRA_TITLES = {
  "/dashboard/profile": { label: "Profile", icon: UserCog },
};

export function getNavGroups(isSuperUser) {
  return isSuperUser ? SUPERUSER_NAV : STAFF_NAV;
}

/**
 * Landing route per role. Not always /dashboard: the layout bounces superusers
 * off the staff dashboard, so linking them there would cause a visible redirect.
 */
export function getHomeRoute(isSuperUser) {
  return isSuperUser ? "/dashboard/restaurant" : "/dashboard";
}

/**
 * Longest-prefix match so nested routes (e.g. /dashboard/menu/edit) inherit
 * their parent's title instead of falling through to "Dashboard".
 */
export function getPageMeta(pathname) {
  const all = [
    ...STAFF_NAV.flatMap((g) => g.items),
    ...SUPERUSER_NAV.flatMap((g) => g.items),
    ...Object.entries(EXTRA_TITLES).map(([route, meta]) => ({ route, ...meta })),
  ];

  const exact = all.find((item) => item.route === pathname);
  if (exact) return exact;

  const prefixed = all
    .filter((item) => item.route !== "/dashboard" && pathname.startsWith(item.route))
    .sort((a, b) => b.route.length - a.route.length)[0];

  return prefixed ?? { label: "Dashboard", icon: GaugeCircle };
}
