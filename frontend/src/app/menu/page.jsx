import { Suspense } from "react";
import CustomerMenu from "./CustomerMenu.jsx";

export const metadata = {
  title: "Menu",
  description: "Browse the menu and order from your table.",
};

export default function Page() {
  return (
    <Suspense fallback={<MenuLoading />}>
      <CustomerMenu />
    </Suspense>
  );
}

/** Matches CustomerMenu's own loading state so there's no flash between them. */
function MenuLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white">
      <div className="size-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <p className="text-sm font-medium text-brand-700">Loading menu…</p>
    </div>
  );
}
