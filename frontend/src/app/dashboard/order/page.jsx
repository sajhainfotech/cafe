"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  Printer,
  RotateCcw,
  Utensils,
  Wallet,
} from "lucide-react";

import PageShell, {
  PageHeader,
  SegmentedControl,
} from "@/components/ui/PageShell";
import { StatCard } from "@/components/ui/Card";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { authHeader, getAuthToken } from "@/lib/cookies";
import { fetchBill } from "@/lib/bill";
import { buildReceiptPdfBlob } from "@/lib/receiptPdf";
import { useNotificationSound } from "@/lib/useNotificationSound";
import { useAccount } from "@/lib/useAccount";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 5000;

/* Ordered as an order actually progresses, so the dropdown reads as a
   lifecycle rather than an arbitrary list. */
const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
];

/** Statuses an order can be moved to from the card. */
const NEXT_STATUSES = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];

/**
 * The normal next step in the kitchen flow, as a one-tap button.
 *
 * Almost every status change is just "move this along", so that shouldn't cost
 * two taps and a menu. The dropdown stays for the exceptions — going backwards,
 * or cancelling.
 */
const NEXT_STEP = {
  Pending: { to: "Preparing", label: "Start preparing" },
  Preparing: { to: "Ready", label: "Mark ready" },
  Ready: { to: "Served", label: "Mark served" },
};

/**
 * Statuses whose orders can't be moved elsewhere from the board.
 *
 * Only Paid: money has changed hands, so reopening it belongs in a refund flow,
 * not a dropdown. Served used to be here because the old table-wide endpoint
 * excluded it, which meant a mis-tapped Served could never be undone.
 * orders/status/<pk> has no such exclusion, so it's correctable again.
 */
const LOCKED_STATUSES = new Set(["Paid"]);

/* Left-edge accent per status, so a full board scans by colour without tinting
   every card background the way the previous version did. */
const ACCENT = {
  Pending: "bg-warning-600",
  Preparing: "bg-info-600",
  Ready: "bg-brand-500",
  Served: "bg-success-600",
  Paid: "bg-ink-400",
  Cancelled: "bg-danger-600",
};

/** Same colours as ACCENT, keyed by the lowercase filter value. */
const TAB_DOT = {
  pending: "bg-warning-600",
  preparing: "bg-info-600",
  ready: "bg-brand-500",
  served: "bg-success-600",
  paid: "bg-ink-400",
  cancelled: "bg-danger-600",
};

/**
 * The calendar date an instant falls on in Kathmandu, as YYYY-MM-DD.
 *
 * Formats in the target zone rather than doing arithmetic on the epoch. The
 * previous version added 5:45 to the timestamp and then read getFullYear() /
 * getDate(), which render in the *browser's* zone — so on a machine already set
 * to Nepal time the offset was applied twice. Anything after ~18:15 rolled into
 * the next day, which is why yesterday evening's paid orders sat on today's
 * board while the server-side count correctly reported none.
 */
const NEPAL_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const getNepalDateString = (date) => {
  if (!date) return "";
  const when = new Date(date);
  if (Number.isNaN(when.getTime())) return "";

  const parts = Object.fromEntries(
    NEPAL_DATE.formatToParts(when).map(({ type, value }) => [type, value]),
  );
  // Sortable, so the week comparison below stays a plain string compare.
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatNepalTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kathmandu",
  });
};

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  const s = String(status).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const money = (n) => `Rs ${Number(n ?? 0).toLocaleString()}`;

/**
 * Pull a readable sentence out of this API's `errors` object.
 *
 * DRF ValidationErrors arrive as { field: [{ message, code }] } (or
 * { field: ["…"] }). The sibling `response` key holds str(exc.detail), which
 * for a ValidationError is a stringified Python dict — technically the message,
 * but not something to show a waiter mid-service.
 */
function firstFieldError(errors) {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors)) {
    const entry = Array.isArray(value) ? value[0] : value;
    if (typeof entry === "string") return entry;
    if (entry && typeof entry.message === "string") return entry.message;
  }
  return null;
}

export default function AdminOrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("today");
  const [statusFilter, setStatusFilter] = useState("pending");
  // At 40+ tables, scanning the board for one table number is slower than
  // typing it.
  const [tableSearch, setTableSearch] = useState("");
  // Per-status totals for the tab badges: how much is waiting in the statuses
  // you're *not* looking at.
  const [counts, setCounts] = useState({});
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [printingFor, setPrintingFor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pendingSettle, setPendingSettle] = useState(null);
  const [settling, setSettling] = useState(false);
  // The bill the server would actually charge, loaded before confirming.
  const [settleBill, setSettleBill] = useState(null);
  const [loadingSettleBill, setLoadingSettleBill] = useState(false);

  // Discount state per table group (keyed by group.key)
  const [groupDiscounts, setGroupDiscounts] = useState({});

  // Only a fallback for the receipt header — GET bill/ supplies these itself.
  const { restaurant, branch } = useAccount();

  const playChime = useNotificationSound();
  const knownOrderIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  const fetchOrders = useCallback(
    async (notify = true) => {
      const token = getAuthToken();
      if (!token) return;

      try {
        // range is sent so the server bounds the payload and the board can't
        // disagree with the badge. The client-side date filter below stays as a
        // fallback for a backend deployed without it.
        const res = await fetch(
          `${API_URL}/api/orders-list/?status=${statusFilter}&range=${range}`,
          { headers: { ...authHeader(), Accept: "application/json" } },
        );
        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);

        const result = await res.json();
        const raw = Array.isArray(result?.data) ? result.data : [];

        // Keyed on the order, not the table. Keyed on the table, a party's
        // second round was already "known" and never rang the bell.
        const currentIds = new Set(
          raw
            .filter((o) => o.order_reference_id)
            .map((o) => o.order_reference_id),
        );

        if (notify && !isFirstLoad.current) {
          const newId = [...currentIds].find(
            (id) => !knownOrderIds.current.has(id),
          );
          if (newId) {
            const order = raw.find((o) => o.order_reference_id === newId);
            await playChime();
            toast.success(
              order?.table_number
                ? `New order — Table ${order.table_number}`
                : "New order received",
              { id: "new-order", duration: 5000 },
            );
          }
        }

        knownOrderIds.current = currentIds;
        isFirstLoad.current = false;

        setOrders(
          raw.map((o) => ({
            // Each row is one order (a "ticket"), not a whole table — a table
            // with two rounds appears twice, each with its own status.
            order_reference_id: o.order_reference_id,
            table_reference_id: o.table_reference_id,
            table_number: o.table_number,
            tableName: o.table_number ? `Table ${o.table_number}` : "Takeout",
            items: Array.isArray(o.items)
              ? o.items.map((i) => ({
                  name: i.menu_name,
                  quantity: Number(i.total_quantity),
                  total_price: Number(i.total_price),
                }))
              : [],
            total_price: Number(o.grand_total),
            status: normalizeStatus(o.status),
            created_at: o.order_time || new Date().toISOString(),
            // Null until settled. Used for date filtering on paid orders, so a
            // table that ordered before midnight and paid after still counts as
            // today's — mirrors the Coalesce in OrderStatusCountApiView.
            paid_at: o.paid_at ?? null,
          })),
        );
      } catch (err) {
        console.error("Order fetch error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    // `range` is in the URL now, so it has to be a dependency or switching
    // Today / Last 7 days would keep serving the previous window.
    [statusFilter, range, playChime],
  );

  /**
   * Tab badges. Counted server-side over the same date window the board shows,
   * because a badge counting a different range from the cards under it would be
   * worse than no badge.
   *
   * Its own request rather than part of the list response: the list returns one
   * status, the badges need all six. It's a single grouped count, so it's cheap
   * at polling frequency.
   */
  const fetchCounts = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const res = await fetch(`${API_URL}/api/orders-count/?range=${range}`, {
        headers: { ...authHeader(), Accept: "application/json" },
      });
      if (!res.ok) return; // Badges are a nicety — never break the board over them.
      const result = await res.json();
      if (result?.data) setCounts(result.data);
    } catch {
      // Same: a failed count leaves the previous badges in place.
    }
  }, [range]);

  useEffect(() => {
    knownOrderIds.current = new Set();
    isFirstLoad.current = true;
    setLoading(true);

    const poll = (notify) => {
      fetchOrders(notify);
      fetchCounts();
    };

    poll(false);
    const interval = setInterval(() => poll(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchCounts]);

  useEffect(() => {
    if (!openMenuFor) return;

    /*
     * Close on an outside click — decided by containment, not propagation.
     *
     * The menu used to close on *any* mousedown, with the menu's wrapper
     * calling stopPropagation() to protect itself. That silently failed: the
     * App Router hydrates the document, so React's delegated listener sits on
     * the same node as this one, and stopPropagation() only stops an event
     * moving to the *next* node — listeners already on this node still run.
     *
     * So mousedown closed the menu, the item unmounted before mouseup, and the
     * click event never fired. The status change looked completely dead.
     */
    const close = (event) => {
      if (event.target?.closest?.("[data-status-menu]")) return;
      setOpenMenuFor(null);
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuFor]);

  const visibleOrders = useMemo(() => {
    const today = getNepalDateString(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = getNepalDateString(weekAgo);

    return orders.filter((o) => {
      // Date an order by when it closed if it has closed, otherwise by when it
      // arrived — the same rule the counts endpoint applies, so the badge and
      // the cards below it can never disagree.
      const day = getNepalDateString(o.paid_at ?? o.created_at);
      return range === "today" ? day === today : day >= weekAgoString;
    });
  }, [orders, range]);

  const inViewRevenue = visibleOrders.reduce(
    (sum, o) => sum + (o.total_price || 0),
    0,
  );
  const itemCount = visibleOrders.reduce(
    (sum, o) => sum + o.items.reduce((n, i) => n + (i.quantity || 0), 0),
    0,
  );

  /**
   * Orders grouped under their table.
   *
   * Status is per order — a party's drinks can be Preparing while their starters
   * are Served. The bill is per table, so Print and Mark paid live on the group
   * header rather than being repeated on every card.
   */
  const tableGroups = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    const groups = new Map();

    for (const order of visibleOrders) {
      if (query && !String(order.tableName).toLowerCase().includes(query)) {
        continue;
      }
      /*
       * Grouped by sitting, not just by table.
       *
       * A table is billed several times a day: one diner orders twice and pays,
       * the next sits down and orders again. Those are separate bills, and
       * everything settled together shares a paid_at — so keying on it keeps
       * two customers' orders from merging into one card with one combined
       * total. Open orders have no paid_at and are all one running bill.
       */
      const key = `${order.table_reference_id}::${order.paid_at ?? "open"}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          table_reference_id: order.table_reference_id,
          paid_at: order.paid_at ?? null,
          tableName: order.tableName,
          orders: [],
          total_price: 0,
        });
      }
      const group = groups.get(key);
      group.orders.push(order);
      group.total_price += order.total_price || 0;
    }

    return [...groups.values()];
  }, [visibleOrders, tableSearch]);

  const changeStatus = async (order, nextStatus) => {
    setOpenMenuFor(null);

    // Without this the URL becomes .../status/undefined/ and the request either
    // 404s at routing or never fires, with nothing on screen to explain why.
    if (!order.order_reference_id) {
      console.error("Order is missing order_reference_id:", order);
      toast.error("This order has no id — refresh the page and try again.");
      return;
    }

    try {
      // add slash after api_url
      const res = await fetch(
        /*
         * Single order, not the whole table.
         *
         * This used to PATCH orders/<table_reference_id>/, which is
         * OrderStatusUpdateApiView — it updates *every* active order at the
         * table in one query. A party with two rounds had both flipped
         * together, so marking the first round Served also marked the drinks
         * that hadn't left the kitchen.
         *
         * orders/status/<pk>/ is OrderChangeStatusApiView, which touches one
         * order.
         */
        `${API_URL}/api/orders/status/${order.order_reference_id}/`,
        {
          method: "PATCH",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: nextStatus.toLowerCase() }),
        },
      );

      const text = await res.text();
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        // Some error responses aren't JSON; fall through to the status code.
      }

      if (!res.ok) {
        // `response` first: that's where this API puts its message
        // (globalparameters.RESPONSE_MESSAGE). Without it every failure showed
        // the bare status code, so a rejected transition looked like nothing
        // had happened at all.
        throw new Error(
          firstFieldError(payload?.errors) ||
            payload?.response ||
            payload?.message ||
            payload?.detail ||
            `Request failed with status ${res.status}`,
        );
      }

      toast.success(
        nextStatus === "Cancelled"
          ? `${order.tableName} cancelled`
          : `${order.tableName} → ${nextStatus}`,
        { id: "order-status" },
      );
      await fetchOrders(false);
    } catch (err) {
      toast.error(err.message || "Could not update this order", {
        id: "order-status-error",
      });
    }
  };

  /**
   * Loads the bill and opens a preview. Read-only, so it settles nothing and is
   * safe to repeat — the figures come from the server's build_bill(), the same
   * function PATCH bill-print/ uses.
   *
   * This used to write into a popup and fire window.print() immediately, so the
   * bill was never actually visible: the print dialog appeared over a window you
   * hadn't seen. Now it renders in-app first, and printing is a deliberate
   * second click. Dropping the popup also removes the pop-up-blocker failure
   * mode entirely.
   */
  const openBillPreview = async (group, discountPercent = 0) => {
    setPrintingFor(group.key ?? group.table_reference_id);
    try {
      // paid_at names the sitting, so reprinting an earlier customer's bill
      // doesn't hand back whoever settled most recently.
      const bill = await fetchBill(group.table_reference_id, group.paid_at);

      // Resolved once and shared by all three outputs — on-screen preview,
      // printout and PDF — so they can't disagree on a name or a timestamp.
      const context = {
        restaurant: bill.restaurantName || restaurant || "Cafe",
        branch: bill.branchName || branch || "",
        openedLabel: stampNepal(bill.openedAt),
        printedLabel:
          stampNepal(bill.printedAt) ?? stampNepal(new Date().toISOString()),
        discountPercent,
      };

      setPreview({
        order: group,
        bill,
        context,
        html: receiptDocument(bill, context),
      });
    } catch (err) {
      // Never fall back to the card's own numbers: showing a total the server
      // didn't produce is the exact drift this endpoint split prevents.
      toast.error(err.message || "Couldn't load the bill");
    } finally {
      setPrintingFor(null);
    }
  };

  /**
   * Open the settle confirmation, loading the real bill first.
   *
   * bill-print/ settles *every* open order at the table, but this card only
   * shows the orders matching the current status filter. A table with a Pending
   * order and a Ready one would have been confirmed at the Pending subtotal and
   * then charged for both. The dialog now quotes the server's own grand total —
   * the same figure bill-print/ will charge, since both run build_bill().
   */
  const askToSettle = async (group, discountPercent = 0) => {
    setPendingSettle(group);
    setSettleBill(null);
    setLoadingSettleBill(true);
    try {
      const bill = await fetchBill(group.table_reference_id);
      setSettleBill({ ...bill, discountPercent });
    } catch {
      // Leave it null; the dialog says it couldn't confirm rather than
      // quoting a number that might be wrong.
    } finally {
      setLoadingSettleBill(false);
    }
  };

  /** The irreversible half: closes the order and marks it paid.
   *  Sends discountPercent in the request body.
   */
  const settleOrder = async () => {
    const order = pendingSettle;
    if (!order) return;

    const discountPercent = groupDiscounts[order.key] || 0;

    if (!getAuthToken()) {
      toast.error("Please sign in again");
      return;
    }

    setSettling(true);
    try {
      // add slash after api_url
      const res = await fetch(
        `${API_URL}/api/table/${order.table_reference_id}/bill-print/`,
        {
          method: "PATCH",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ discount: discountPercent }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          firstFieldError(data?.errors) ||
            data.response ||
            data.message ||
            data.detail ||
            `Request failed with status ${res.status}`,
        );
      }

      toast.success(`${order.tableName} marked paid`);
      setPendingSettle(null);
      setSettleBill(null);
      setGroupDiscounts((prev) => ({ ...prev, [order.key]: 0 }));
      await fetchOrders(false);
      fetchCounts();
    } catch (err) {
      toast.error(err.message || "Unable to close this order");
    } finally {
      setSettling(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Orders"
        subtitle="Live kitchen board — refreshes every 5 seconds."
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Find table…"
      >
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
        />
      </PageHeader>

      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="Filter by status"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide"
      >
        {STATUS_FILTERS.map((s) => {
          const active = s.value === statusFilter;
          const count = counts[s.value];
          return (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(s.value)}
              aria-label={
                count === undefined ? s.label : `${s.label}, ${count} orders`
              }
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pl-3",
                count === undefined ? "pr-3" : "pr-1.5",
                "text-xs font-semibold transition-colors cursor-pointer",
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-ink-300 bg-white text-ink-600 hover:border-ink-400 hover:text-ink-900",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  active ? "bg-white/70" : TAB_DOT[s.value],
                )}
              />
              {s.label}
              {count !== undefined && (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 py-0.5 text-2xs font-bold tabular-nums",
                    active
                      ? "bg-white/20 text-white"
                      : count > 0
                        ? "bg-ink-100 text-ink-700"
                        : "bg-transparent text-ink-400",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={`${statusFilter} orders`}
          value={visibleOrders.length}
          icon={ClipboardList}
          tone="brand"
          loading={loading}
        />
        <StatCard
          label="Items in view"
          value={itemCount}
          icon={Utensils}
          tone="info"
          loading={loading}
        />
        <StatCard
          label={statusFilter === "paid" ? "Collected" : "Value in view"}
          value={money(inViewRevenue)}
          icon={Wallet}
          tone="success"
          loading={loading}
          hint={
            statusFilter === "paid"
              ? "Settled and collected"
              : `${statusFilter} only — not yet paid`
          }
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-ink-200 bg-white p-4"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white">
          <EmptyState
            icon={ClipboardList}
            title={`No ${statusFilter} orders`}
            description={
              range === "today"
                ? "Nothing with this status today. New orders appear here automatically."
                : "Nothing with this status in the last 7 days."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {tableGroups.map((group) => (
            <TableGroup
              key={group.key}
              group={group}
              openMenuFor={openMenuFor}
              setOpenMenuFor={setOpenMenuFor}
              onChangeStatus={changeStatus}
              onPrint={openBillPreview}
              printing={printingFor === group.key}
              onSettle={askToSettle}
              discountPercent={groupDiscounts[group.key] || 0}
              onDiscountChange={(value) =>
                setGroupDiscounts((prev) => ({ ...prev, [group.key]: value }))
              }
            />
          ))}
        </div>
      )}

      <BillPreview preview={preview} onClose={() => setPreview(null)} />

      <ConfirmDialog
        open={Boolean(pendingSettle)}
        onClose={() => {
          setPendingSettle(null);
          setSettleBill(null);
        }}
        onConfirm={settleOrder}
        loading={settling}
        title="Mark order as paid"
        confirmLabel="Mark paid"
        tone="primary"
        message={
          loadingSettleBill ? (
            "Checking the bill…"
          ) : settleBill ? (
            <>
              This closes{" "}
              <span className="font-semibold text-ink-900">
                {pendingSettle?.tableName}
              </span>{" "}
              — every open order on it,{" "}
              <span className="font-semibold text-ink-900">
                {settleBill.items.length} line
                {settleBill.items.length === 1 ? "" : "s"}
              </span>
              {" totalling "}
              <span className="font-semibold text-ink-900">
                {money(settleBill.subTotal)}
              </span>
              .{/* Discount input with up/down arrows inside */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm font-medium text-ink-700">
                  Discount (%):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={groupDiscounts[pendingSettle?.key] || 0}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (raw === "") {
                        setGroupDiscounts((prev) => ({
                          ...prev,
                          [pendingSettle?.key]: 0,
                        }));
                      } else {
                        const num = parseInt(raw, 10);
                        const clamped = Math.min(100, Math.max(0, num));
                        setGroupDiscounts((prev) => ({
                          ...prev,
                          [pendingSettle?.key]: clamped,
                        }));
                      }
                    }}
                    className="w-16 rounded border border-ink-300 pr-6 py-1 text-center text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        const current = groupDiscounts[pendingSettle?.key] || 0;
                        const newVal = Math.min(100, current + 1);
                        setGroupDiscounts((prev) => ({
                          ...prev,
                          [pendingSettle?.key]: newVal,
                        }));
                      }}
                      className="flex h-1/2 items-center justify-center px-0.5 hover:bg-ink-100 rounded-tr border-l border-ink-300"
                    >
                      <ChevronUp className="h-2.5 w-2.5 text-ink-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = groupDiscounts[pendingSettle?.key] || 0;
                        const newVal = Math.max(0, current - 1);
                        setGroupDiscounts((prev) => ({
                          ...prev,
                          [pendingSettle?.key]: newVal,
                        }));
                      }}
                      className="flex h-1/2 items-center justify-center px-0.5 hover:bg-ink-100 rounded-br border-l border-t border-ink-300"
                    >
                      <ChevronDown className="h-2.5 w-2.5 text-ink-600" />
                    </button>
                  </div>
                </div>
              </div>
              {(() => {
                const discount = groupDiscounts[pendingSettle?.key] || 0;
                const discountAmount = (settleBill.subTotal * discount) / 100;
                const grandTotal = settleBill.subTotal - discountAmount;
                return (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{money(settleBill.subTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-success-700">
                        <span>Discount ({discount}%):</span>
                        <span>-{money(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{money(grandTotal)}</span>
                    </div>
                  </div>
                );
              })()}
              <p className="mt-2 text-xs text-ink-500">
                Only do this once the customer has actually paid — it can&apos;t
                be undone from here.
              </p>
            </>
          ) : (
            <>
              Couldn&apos;t load the bill for{" "}
              <span className="font-semibold text-ink-900">
                {pendingSettle?.tableName}
              </span>
              . Settling still closes <em>every</em> open order on this table,
              which may be more than the {statusFilter} orders shown here.
            </>
          )
        }
      />
    </PageShell>
  );
}

/**
 * One table, with each of its orders listed separately.
 *
 * The split matters: status is a property of an order (the kitchen makes one
 * round at a time), while the bill is a property of the table (the party pays
 * once). So Print and Mark paid sit up here, and each order below carries its
 * own status control.
 */
function TableGroup({
  group,
  openMenuFor,
  setOpenMenuFor,
  onChangeStatus,
  onPrint,
  printing,
  onSettle,
  discountPercent,
  onDiscountChange,
}) {
  const allClosed = group.orders.every(
    (o) => o.status === "Cancelled" || o.status === "Paid",
  );
  const isPaid = group.orders.some((o) => o.status === "Paid");

  // A cancelled order was never charged, so there's no bill to produce. If
  // every order here is cancelled the server has nothing to build from either
  // — offering Print would only ever return "No orders found for this table".
  // A mixed group still bills its surviving orders.
  const canPrint = group.orders.some((o) => o.status !== "Cancelled");

  return (
    <section className="rounded-xl border border-ink-300 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-ink-200 bg-ink-50 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink-900">{group.tableName}</h3>
          <p className="mt-0.5 text-2xs text-ink-500">
            {group.orders.length} order{group.orders.length > 1 ? "s" : ""} ·{" "}
            <span className="font-semibold tabular-nums text-ink-700">
              {money(group.total_price)}
            </span>
            {group.paid_at && <> · paid {formatNepalTime(group.paid_at)}</>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Discount input with up/down arrows inside */}
          {!isPaid && (
            <div className="flex items-center gap-1">
              <span className="text-md text-ink-700 font-medium">Disc:</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={discountPercent}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw === "") {
                      onDiscountChange(0);
                    } else {
                      const num = parseInt(raw, 10);
                      const clamped = Math.min(100, Math.max(0, num));
                      onDiscountChange(clamped);
                    }
                  }}
                  className="w-12 rounded border border-ink-300 pr-5 py-1 text-center text-xs"
                  disabled={isPaid}
                />
                <div className="absolute inset-y-0 right-0 flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = Math.min(100, discountPercent + 1);
                      onDiscountChange(newVal);
                    }}
                    className="flex h-1/2 items-center justify-center px-0.5 hover:bg-ink-100 rounded-tr border-l border-ink-300"
                    disabled={isPaid}
                  >
                    <ChevronUp className="h-2 w-2 text-ink-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = Math.max(0, discountPercent - 1);
                      onDiscountChange(newVal);
                    }}
                    className="flex h-1/2 items-center justify-center px-0.5 hover:bg-ink-100 rounded-br border-l border-t border-ink-300"
                    disabled={isPaid}
                  >
                    <ChevronDown className="h-2 w-2 text-ink-600" />
                  </button>
                </div>
              </div>
              <span className="text-2xs text-red-600 font-bold">%</span>
            </div>
          )}

          {!canPrint && (
            <Badge tone="danger">Cancelled — nothing to bill</Badge>
          )}

          {canPrint && (
            <Button
              size="sm"
              variant="secondary"
              icon={isPaid ? RotateCcw : Printer}
              loading={printing}
              onClick={() => onPrint(group, discountPercent)}
            >
              {isPaid ? "Reprint" : "Print bill"}
            </Button>
          )}
          {!allClosed && (
            <Button
              size="sm"
              variant="primary"
              icon={BadgeCheck}
              onClick={() => onSettle(group, discountPercent)}
            >
              Mark paid
            </Button>
          )}
        </div>
      </header>

      <div className="space-y-2 p-2.5">
        {group.orders.map((order, index) => {
          const cardKey =
            order.order_reference_id ?? `${group.table_reference_id}-${index}`;

          return (
            <OrderCard
              key={cardKey}
              order={order}
              index={index}
              menuOpen={openMenuFor === cardKey}
              onToggleMenu={() =>
                setOpenMenuFor((prev) => (prev === cardKey ? null : cardKey))
              }
              onChangeStatus={onChangeStatus}
            />
          );
        })}
      </div>
    </section>
  );
}

/** A single order — its own items, its own status. */
function OrderCard({ order, index, menuOpen, onToggleMenu, onChangeStatus }) {
  const statusLocked = LOCKED_STATUSES.has(order.status);
  const nextStep = NEXT_STEP[order.status];

  return (
    <article className="relative flex flex-col rounded-lg border border-ink-200 bg-white">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-lg",
          ACCENT[order.status] ?? "bg-ink-300",
        )}
      />

      <header className="flex items-start justify-between gap-2 border-b border-ink-100 px-3 py-2 pl-4">
        <div className="min-w-0">
          <p className="text-2xs font-bold uppercase tracking-wider text-ink-500">
            Order {index + 1}
          </p>
          <p className="mt-0.5 text-2xs text-ink-500 tabular-nums">
            {formatNepalTime(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <div className="flex-1 px-3 py-2 pl-4">
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 text-ink-700">
                <span className="mr-1.5 font-bold tabular-nums text-ink-400">
                  {item.quantity}×
                </span>
                {item.name}
              </span>
              <span className="shrink-0 tabular-nums text-ink-500">
                {money(item.total_price)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-ink-100 px-3 py-2 pl-4">
        <span className="text-sm font-bold tabular-nums text-ink-900">
          {money(order.total_price)}
        </span>

        {statusLocked ? (
          <span className="text-2xs font-semibold text-ink-400">Paid</span>
        ) : (
          <div data-status-menu className="relative flex items-stretch">
            {nextStep && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onChangeStatus(order, nextStep.to)}
                className="rounded-r-none"
              >
                {nextStep.label}
              </Button>
            )}

            <Button
              size="sm"
              variant={nextStep ? "primary" : "secondary"}
              iconRight={ChevronDown}
              onClick={onToggleMenu}
              title="Change to any status"
              aria-label="Change to any status"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={cn(
                nextStep && "rounded-l-none border-l border-white/30 px-2",
              )}
            >
              {nextStep ? null : "Change status"}
            </Button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop animate-pop-in"
              >
                <p className="px-2 pb-1 pt-0.5 text-2xs font-bold uppercase tracking-wider text-ink-400">
                  Move to
                </p>

                {NEXT_STATUSES.filter(
                  (s) => s !== order.status && s !== "Cancelled",
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    onClick={() => onChangeStatus(order, s)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-ink-700 transition-colors cursor-pointer hover:bg-ink-100 hover:text-ink-900"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        ACCENT[s] ?? "bg-ink-300",
                      )}
                    />
                    {s}
                  </button>
                ))}

                {order.status !== "Cancelled" && (
                  <>
                    <div aria-hidden="true" className="my-1 h-px bg-ink-200" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onChangeStatus(order, "Cancelled")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-semibold text-danger-600 transition-colors cursor-pointer hover:bg-danger-50"
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-danger-600"
                      />
                      Cancel order
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}

/**
 * Bill preview.
 *
 * The receipt renders in an iframe from the very same HTML string that gets
 * printed and downloaded, so the preview is not an approximation of the
 * printout — it is the printout. Printing targets the iframe's own window, so
 * the surrounding dashboard is never part of the job and no pop-up is involved.
 */
function BillPreview({ preview, onClose }) {
  const frameRef = useRef(null);

  const handlePrint = () => {
    const frame = frameRef.current?.contentWindow;
    if (!frame) return;
    frame.focus();
    frame.print();
  };

  const handleDownload = () => {
    const { bill, context } = preview;
    const url = URL.createObjectURL(buildReceiptPdfBlob(bill, context));

    const link = document.createElement("a");
    link.href = url;
    link.download = `bill-table-${bill.tableNumber ?? "order"}.pdf`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal
      open={Boolean(preview)}
      onClose={onClose}
      title={`Bill — ${preview?.order?.tableName ?? ""}`}
      description="Check the bill before printing. Nothing is charged yet."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button size="sm" icon={Printer} onClick={handlePrint}>
            Print
          </Button>
        </>
      }
    >
      {preview && (
        <>
          <iframe
            ref={frameRef}
            srcDoc={preview.html}
            title="Bill preview"
            className="h-[55vh] w-full rounded-lg border border-ink-200 bg-ink-50"
          />
          <p className="mt-2 text-2xs text-ink-500">
            To keep a digital copy, choose <b>Save as PDF</b> as the destination
            in the print dialog.
          </p>
        </>
      )}
    </Modal>
  );
}

/* ==========================================================================
   Receipt rendering
   Every figure below comes from GET bill/ — the client never computes bill
   totals, so what prints always matches what build_bill() will charge.
   However, we now apply a discount percentage on the client side for preview.
   ========================================================================== */

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/**
 * Format money with proper decimal places.
 * Shows 2 decimal places for fractional amounts, and whole numbers without decimals when possible.
 */
const rupees = (value) => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "Rs. 0.00";
  const formatted = num.toFixed(2);
  // If it's a whole number (e.g., 350.00), show without decimal
  if (formatted.endsWith(".00")) {
    return `Rs. ${Math.round(num).toLocaleString()}`;
  }
  return `Rs. ${formatted}`;
};

const stampNepal = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
};

const RECEIPT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Courier New", monospace;
    background: #f4f4f4;
    display: flex;
    justify-content: center;
    padding: 12px 6px;
    color: #111;
  }
  .receipt { width: 100%; max-width: 288px; background: #fff; padding: 12px; }
  .dup { text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding-bottom: 4px; }
  .store { text-align: center; font-size: 15px; font-weight: 700; letter-spacing: .5px; }
  .branch { text-align: center; font-size: 8px; text-transform: uppercase; letter-spacing: .8px; color: #777; margin-top: 2px; }
  .rule { border: none; border-top: 1px dashed #bbb; margin: 8px 0; }
  .meta { display: flex; justify-content: space-between; font-size: 9px; padding: 1px 0; }
  .meta b { font-weight: 700; }
  .head, .row { display: flex; font-size: 9px; }
  .head { text-transform: uppercase; letter-spacing: .4px; color: #888; padding-bottom: 3px; border-bottom: 1px solid #eee; }
  .row { font-size: 10px; padding: 3px 0; align-items: baseline; }
  .name { flex: 1; padding-right: 4px; word-break: break-word; }
  .qty { width: 26px; text-align: center; font-weight: 700; }
  .rate { width: 52px; text-align: right; }
  .amt { width: 60px; text-align: right; font-weight: 700; }
  .sums { margin-top: 6px; padding-top: 5px; border-top: 1px dashed #bbb; }
  .sum { display: flex; justify-content: space-between; font-size: 10px; padding: 1px 0; }
  .sum.discount { color: #0f7b3a; font-size: 12px; font-weight: 700; }
  .total { display: flex; justify-content: space-between; align-items: baseline; border-top: 2px solid #111; padding-top: 6px; margin-top: 5px; }
  .total span:first-child { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .total span:last-child { font-size: 15px; font-weight: 700; }
  .foot { text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #bbb; }
  .foot .thanks { font-size: 11px; font-weight: 700; }
  .foot .sub { font-size: 8px; color: #888; margin-top: 2px; }
  .wait { padding: 40px 12px; text-align: center; font-size: 11px; color: #666; }
  @media print { body { background: #fff; padding: 0; } .receipt { padding: 8px; } }
`;

const receiptShell = (title, inner) => `<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>${RECEIPT_CSS}</style></head><body>${inner}</body></html>`;

/**
 * Receipt document – applies discountPercent from context with proper decimal precision.
 * All monetary values are formatted with 2 decimal places for accuracy.
 */
function receiptDocument(bill, context) {
  const {
    restaurant,
    branch,
    openedLabel: opened,
    printedLabel: printed,
    discountPercent = 0,
  } = context;

  // Use high precision for calculations
  const subTotal = Number(bill.subTotal) || 0;
  const discountAmount = (subTotal * discountPercent) / 100;
  const grandTotal = subTotal - discountAmount;
  const hasDiscount = discountPercent > 0;

  const rows = bill.items
    .map(
      (item) => `<div class="row">
        <span class="name">${escapeHtml(item.name)}${
          item.unitName ? ` <small>(${escapeHtml(item.unitName)})</small>` : ""
        }</span>
        <span class="qty">${item.quantity}</span>
        <span class="rate">${rupees(item.unitPrice)}</span>
        <span class="amt">${rupees(item.totalPrice)}</span>
      </div>`,
    )
    .join("");

  return receiptShell(
    `Bill — Table ${bill.tableNumber ?? ""}`,
    `<div class="receipt">
      ${bill.isReprint ? `<div class="dup">*** DUPLICATE ***</div>` : ""}
      <div class="store">${escapeHtml(restaurant)}</div>
      ${branch ? `<div class="branch">${escapeHtml(branch)}</div>` : ""}
      <hr class="rule" />
      <div class="meta"><span>Table</span><b>${escapeHtml(bill.tableNumber ?? "—")}</b></div>
      ${opened ? `<div class="meta"><span>Opened</span><b>${opened}</b></div>` : ""}
      ${printed ? `<div class="meta"><span>Billed</span><b>${printed}</b></div>` : ""}
      <hr class="rule" />
      <div class="head">
        <span class="name">Item</span><span class="qty">Qty</span>
        <span class="rate">Rate</span><span class="amt">Amount</span>
      </div>
      ${rows}
      <div class="sums">
        <div class="sum"><span>Sub total</span><span>${rupees(subTotal)}</span></div>
        ${
          hasDiscount
            ? `<div class="sum discount"><span>Discount (${discountPercent}%)</span><span>− ${rupees(discountAmount)}</span></div>`
            : ""
        }
      </div>
      <div class="total"><span>Total</span><span>${rupees(grandTotal)}</span></div>
      <div class="foot">
        <div class="thanks">Thank you!</div>
        <div class="sub">We hope to see you again</div>
      </div>
    </div>`,
  );
}
