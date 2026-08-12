"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import {
  Minus,
  Plus,
  ReceiptText,
  Search,
  Soup,
  UtensilsCrossed,
  X,
} from "lucide-react";

import ImageThumb from "@/components/ui/ImageThumb";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  fetchTableOrders,
  readHistory,
  statusMeta,
  writeHistory,
} from "@/lib/customerOrders";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORDERS_POLL_INTERVAL = 10000;

const money = (n) => `Rs ${Number(n ?? 0).toLocaleString()}`;

export default function CustomerMenu() {
  const searchParams = useSearchParams();
  const tableToken =
    searchParams.get("token") || searchParams.get("table_token");

  const [tab, setTab] = useState("menu");
  const [table, setTable] = useState(null);
  const [menuList, setMenuList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  // null = haven't probed yet, true = endpoint exists, false = fall back local.
  const [liveSupported, setLiveSupported] = useState(null);
  const [serverOrders, setServerOrders] = useState([]);

  useEffect(() => {
    setHistory(readHistory(tableToken));
  }, [tableToken]);

  const refreshServerOrders = useCallback(async () => {
    if (!tableToken) return;
    const { supported, orders } = await fetchTableOrders(tableToken);
    if (supported === false) {
      setLiveSupported(false);
      return;
    }
    if (supported === true) {
      setLiveSupported(true);
      setServerOrders(orders);
    }
    // supported === null: transient, keep what we have.
  }, [tableToken]);

  // Probe once on load so the tab badge is right before it's opened.
  useEffect(() => {
    refreshServerOrders();
  }, [refreshServerOrders]);

  // Poll only while the receipts are on screen, and only if the endpoint is
  // actually there — a missing endpoint costs one request, not one every 10s.
  useEffect(() => {
    if (tab !== "orders" || liveSupported === false) return;
    const interval = setInterval(refreshServerOrders, ORDERS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [tab, liveSupported, refreshServerOrders]);

  // Server wins when present: it sees every phone at the table, not just this one.
  const orders = liveSupported ? serverOrders : history;

  useEffect(() => {
    if (!tableToken) {
      toast.error("This QR code isn't valid");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/order-scan/`, {
          params: { token: tableToken },
        });

        if (res.data.code === "0") {
          setTable(res.data.data?.summary_data);
          setMenuList(
            (res.data.data?.details_data || []).map((m) => ({
              ...m,
              quantity: 0,
              price: Number(m.price),
            })),
          );
        } else {
          toast.error("Couldn't load the menu");
        }
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load the menu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableToken]);

  const changeQty = useCallback((referenceId, delta) => {
    setMenuList((prev) =>
      prev.map((item) =>
        item.reference_id === referenceId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      ),
    );
  }, []);

  const filteredMenu = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return menuList;
    return menuList.filter((item) => item.name?.toLowerCase().includes(q));
  }, [menuList, searchTerm]);

  const totalItems = menuList.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = menuList.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const submitOrder = async () => {
    if (!totalItems) return;

    const chosen = menuList.filter((m) => m.quantity > 0);

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/orders/`, {
        table_id: table?.table_id || "",
        table_number: table?.table_number || "",
        items: chosen.map((i) => ({
          menu_id: i.reference_id,
          name: i.name,
          unit_name: i.unit_name,
          quantity: i.quantity,
          item_price: i.price,
          total_price: i.price * i.quantity,
        })),
        total_price: totalPrice,
        status: "pending",
        token: tableToken,
      });

      if (res.status !== 200 && res.status !== 201) {
        throw new Error("Something went wrong");
      }

      const record = {
        placedAt: new Date().toISOString(),
        total: totalPrice,
        items: chosen.map((i) => ({
          name: i.name,
          unit_name: i.unit_name,
          quantity: i.quantity,
          total_price: i.price * i.quantity,
        })),
      };
      // Always record locally, even when the server endpoint exists: it makes
      // the receipt appear instantly instead of on the next poll, and keeps the
      // fallback warm if the endpoint goes away.
      const next = [record, ...history];
      setHistory(next);
      writeHistory(tableToken, next);

      setMenuList((prev) => prev.map((m) => ({ ...m, quantity: 0 })));
      toast.success("Order sent to the kitchen!");
      // Land them on the receipt so there's proof the order went through.
      setTab("orders");
      window.scrollTo({ top: 0, behavior: "smooth" });
      refreshServerOrders();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't place the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-700">Loading menu…</p>
      </div>
    );
  }

  if (!table || menuList.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <div className="rounded-full bg-ink-100 p-4">
          <Soup className="size-8 text-ink-400" aria-hidden="true" />
        </div>
        <p className="text-base font-semibold text-ink-900">
          No menu available
        </p>
        <p className="max-w-xs text-sm text-ink-500">
          Ask a member of staff — this table&apos;s menu isn&apos;t set up yet.
        </p>
      </div>
    );
  }

  const showBar = tab === "menu" && totalItems > 0;

  return (
    <div
      className="min-h-dvh bg-ink-50"
      style={{
        // Clear the sticky order bar and the iPhone home indicator.
        paddingBottom: showBar
          ? "calc(9rem + env(safe-area-inset-bottom))"
          : "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      <header className="sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3 bg-brand-700 px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-2">
            <UtensilsCrossed className="size-5 shrink-0" aria-hidden="true" />
            <h1 className="truncate text-base font-bold tracking-tight">
              {table?.restaurant_name || "Menu"}
            </h1>
          </div>
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
            Table {table?.table_number ?? "—"}
          </span>
        </div>

        {/* The header used to hold a cart icon that wasn't clickable and led
            nowhere. The sticky bar at the bottom already is the cart, so this
            slot now goes to something that was genuinely missing: a way to see
            what you've already ordered. */}
        <nav
          role="tablist"
          aria-label="Sections"
          className="flex border-b border-ink-200 bg-white shadow-header"
        >
          <Tab
            active={tab === "menu"}
            onClick={() => setTab("menu")}
            icon={Soup}
            label="Menu"
          />
          <Tab
            active={tab === "orders"}
            onClick={() => setTab("orders")}
            icon={ReceiptText}
            label="My orders"
            count={orders.length}
          />
        </nav>
      </header>

      {tab === "menu" ? (
        <>
          <div className="bg-white px-4 pb-3 pt-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dishes…"
                aria-label="Search dishes"
                /* text-base (16px) is deliberate: iOS Safari zooms the whole
                   page when you focus an input below 16px. */
                className="h-11 w-full rounded-lg border border-ink-300 bg-ink-50 pl-9 pr-10 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-400 active:bg-ink-100"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <main className="space-y-2 px-3 pt-3">
            {filteredMenu.length === 0 ? (
              <div className="py-16 text-center">
                <Soup
                  className="mx-auto size-10 text-ink-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-medium text-ink-500">
                  Nothing matched “{searchTerm}”.
                </p>
              </div>
            ) : (
              filteredMenu.map((item) => (
                <MenuRow
                  key={item.reference_id}
                  item={item}
                  onChangeQty={changeQty}
                />
              ))
            )}
          </main>
        </>
      ) : (
        <OrdersTab
          orders={orders}
          live={liveSupported === true}
          tableNumber={table?.table_number}
          onBrowse={() => setTab("menu")}
        />
      )}

      {showBar && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 animate-slide-up border-t border-brand-800 bg-brand-700 px-4 pt-3"
          style={{
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <div className="mb-2.5 flex items-center justify-between text-white">
            <p className="text-sm font-semibold">
              {totalItems} item{totalItems > 1 ? "s" : ""}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {money(totalPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={submitOrder}
            disabled={submitting}
            className="h-12 w-full rounded-lg bg-white text-base font-bold text-brand-700 transition-colors active:bg-brand-100 disabled:opacity-70"
          >
            {submitting ? "Sending…" : "Place order"}
          </button>
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        // h-12 keeps the tap target comfortably above the 44px minimum.
        "relative flex h-12 flex-1 items-center justify-center gap-1.5 text-sm font-semibold transition-colors",
        active ? "text-brand-700" : "text-ink-500 active:bg-ink-50",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
      {count > 0 && (
        <span className="rounded-full bg-brand-100 px-1.5 text-2xs font-bold text-brand-700 tabular-nums">
          {count}
        </span>
      )}
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-3 bottom-0 h-0.5 rounded-t bg-brand-600"
        />
      )}
    </button>
  );
}

function MenuRow({ item, onChangeQty }) {
  const inCart = item.quantity > 0;

  return (
    <article className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5">
      <ImageThumb
        src={item.image}
        alt={item.name}
        size={56}
        rounded="rounded-lg"
      />

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold leading-snug text-ink-900">
          {item.name}
        </h3>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-base font-bold tabular-nums text-brand-700">
            {money(item.price)}
          </span>
          {item.unit_name && (
            <span className="text-2xs font-semibold uppercase text-ink-400">
              / {item.unit_name}
            </span>
          )}
        </p>
      </div>

      {/* Collapsed to a single "Add" until there's something to decrement —
          a "− 0 +" stepper on every row is noise on a phone. */}
      {inCart ? (
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-brand-200 bg-brand-50 p-0.5">
          <StepperButton
            onClick={() => onChangeQty(item.reference_id, -1)}
            label={`Remove one ${item.name}`}
          >
            <Minus className="size-4" aria-hidden="true" />
          </StepperButton>
          <span
            aria-live="polite"
            className="min-w-6 text-center text-sm font-bold tabular-nums text-brand-800"
          >
            {item.quantity}
          </span>
          <StepperButton
            onClick={() => onChangeQty(item.reference_id, 1)}
            label={`Add one more ${item.name}`}
          >
            <Plus className="size-4" aria-hidden="true" />
          </StepperButton>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChangeQty(item.reference_id, 1)}
          className="h-10 shrink-0 rounded-lg border border-brand-300 bg-white px-4 text-sm font-bold text-brand-700 transition-colors active:bg-brand-100"
        >
          Add
        </button>
      )}
    </article>
  );
}

function StepperButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-md bg-white text-brand-700 shadow-card transition-colors active:bg-brand-100"
    >
      {children}
    </button>
  );
}

/**
 * Receipts for this table's orders.
 *
 * `live` means the values came from the server, so the kitchen status is real.
 * Without it, the list is what this phone sent and every order reads "Sent to
 * kitchen" — a guessed "Preparing"/"Ready" would be worse than none.
 */
function OrdersTab({ orders, live, tableNumber, onBrowse }) {
  if (orders.length === 0) {
    return (
      <div className="px-6 py-20 text-center">
        <div className="mx-auto w-fit rounded-full bg-ink-100 p-4">
          <ReceiptText className="size-7 text-ink-400" aria-hidden="true" />
        </div>
        <p className="mt-3 text-base font-semibold text-ink-900">
          No orders yet
        </p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500">
          Anything you order from the menu will show up here.
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="mt-5 h-11 rounded-lg bg-brand-600 px-6 text-sm font-bold text-white active:bg-brand-700"
        >
          Browse the menu
        </button>
      </div>
    );
  }

  return (
    <main className="space-y-3 px-3 pt-3">
      <p className="flex items-center gap-1.5 px-1 text-2xs text-ink-500">
        {live ? (
          <>
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-600/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success-600" />
            </span>
            Live status for table {tableNumber} — updates automatically.
          </>
        ) : (
          // Without the server endpoint these are this phone's own records, so
          // they show what was sent, not what the kitchen has done since.
          <>
            This visit&apos;s orders from this phone, table {tableNumber}. Ask a
            staff member for the latest status.
          </>
        )}
      </p>

      {orders.map((order, idx) => {
        const { label, tone } = statusMeta(order.status);
        return (
          <section
            key={order.id ?? order.placedAt ?? idx}
            className="overflow-hidden rounded-xl border border-ink-200 bg-white"
          >
            <header className="flex items-center justify-between gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
              <div>
                <p className="text-sm font-bold text-ink-900">
                  Order {orders.length - idx}
                </p>
                <p className="text-2xs text-ink-500 tabular-nums">
                  {order.placedAt
                    ? new Date(order.placedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : ""}
                </p>
              </div>
              <Badge tone={tone} dot>
                {label}
              </Badge>
            </header>

            <ul className="divide-y divide-ink-100">
              {order.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0 text-ink-700">
                    <span className="mr-1.5 font-bold tabular-nums text-ink-400">
                      {item.quantity}×
                    </span>
                    {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-600">
                    {money(item.total_price)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="flex items-baseline justify-between border-t border-ink-200 px-4 py-2.5">
              <span className="text-2xs font-bold uppercase tracking-wider text-ink-500">
                Total
              </span>
              <span className="text-base font-bold tabular-nums text-ink-900">
                {money(order.total)}
              </span>
            </footer>
          </section>
        );
      })}
    </main>
  );
}
