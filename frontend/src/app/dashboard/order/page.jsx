"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  ChevronDown,
  ClipboardList,
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
import { ConfirmDialog } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { authHeader, getAuthToken } from "@/lib/cookies";
import { fetchBill } from "@/lib/bill";
import { useNotificationSound } from "@/lib/useNotificationSound";
import { useAccount } from "@/lib/useAccount";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 5000;

const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "cancelled", label: "Cancelled" },
];

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
];

/** Statuses an order can be moved to from the card. */
const NEXT_STATUSES = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];

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

const toNepalDate = (date) => {
  if (!date) return null;
  return new Date(new Date(date).getTime() + 5.75 * 60 * 60 * 1000);
};

const getNepalDateString = (date) => {
  const nepal = toNepalDate(date);
  if (!nepal) return "";
  return [
    nepal.getFullYear(),
    String(nepal.getMonth() + 1).padStart(2, "0"),
    String(nepal.getDate()).padStart(2, "0"),
  ].join("-");
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

export default function AdminOrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("today");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [printingFor, setPrintingFor] = useState(null);
  const [pendingSettle, setPendingSettle] = useState(null);
  const [settling, setSettling] = useState(false);

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
        const res = await fetch(
          `${API_URL}api/orders-list/?status=${statusFilter}`,
          { headers: { ...authHeader(), Accept: "application/json" } },
        );
        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);

        const result = await res.json();
        const raw = Array.isArray(result?.data) ? result.data : [];

        const currentIds = new Set(
          raw
            .filter((o) => o.table_reference_id)
            .map((o) => o.table_reference_id),
        );

        if (notify && !isFirstLoad.current) {
          const newId = [...currentIds].find(
            (id) => !knownOrderIds.current.has(id),
          );
          if (newId) {
            const order = raw.find((o) => o.table_reference_id === newId);
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
          })),
        );
      } catch (err) {
        console.error("Order fetch error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, playChime],
  );

  useEffect(() => {
    knownOrderIds.current = new Set();
    isFirstLoad.current = true;
    setLoading(true);

    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (!openMenuFor) return;
    const close = () => setOpenMenuFor(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuFor]);

  const visibleOrders = useMemo(() => {
    const today = getNepalDateString(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = getNepalDateString(weekAgo);

    return orders.filter((o) => {
      const day = getNepalDateString(o.created_at);
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

  const changeStatus = async (order, nextStatus) => {
    setOpenMenuFor(null);
    try {
      const res = await fetch(
        `${API_URL}api/orders/${order.table_reference_id}/`,
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
        throw new Error(
          payload?.message ||
            payload?.error ||
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
   * Prints from GET bill/ — read-only, so this is safe to repeat and settles
   * nothing. The figures come from the server's build_bill(), the same function
   * PATCH bill-print/ uses, so the printed bill and the charged amount agree.
   *
   * The popup is opened synchronously, before the await: a window.open() that
   * happens after an await has lost the user-gesture context and gets blocked.
   * It shows "Preparing bill…" until the response lands.
   */
  const printReceipt = async (order) => {
    const win = window.open("", "_blank", "width=380,height=680");
    if (!win) {
      toast.error("Allow pop-ups for this site to print bills");
      return;
    }
    win.document.write(loadingDocument());
    win.document.close();

    setPrintingFor(order.table_reference_id);
    try {
      const bill = await fetchBill(order.table_reference_id);

      win.document.open();
      win.document.write(receiptDocument(bill, { restaurant, branch }));
      win.document.close();
      win.focus();
      win.print();
    } catch (err) {
      // Never fall back to the card's own numbers: printing a total the server
      // didn't produce is the exact drift this endpoint split prevents.
      win.document.open();
      win.document.write(errorDocument(err.message));
      win.document.close();
      toast.error(err.message || "Couldn't load the bill");
    } finally {
      setPrintingFor(null);
    }
  };

  /** The irreversible half: closes the order and marks it paid. */
  const settleOrder = async () => {
    const order = pendingSettle;
    if (!order) return;

    if (!getAuthToken()) {
      toast.error("Please sign in again");
      return;
    }

    setSettling(true);
    try {
      const res = await fetch(
        `${API_URL}api/table/${order.table_reference_id}/bill-print/`,
        {
          method: "PATCH",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            data.detail ||
            `Request failed with status ${res.status}`,
        );
      }

      toast.success(`${order.tableName} marked paid`);
      setPendingSettle(null);
      await fetchOrders(false);
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
      >
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="sm:w-40"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </PageHeader>

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
          label="Value in view"
          value={money(inViewRevenue)}
          icon={Wallet}
          tone="success"
          loading={loading}
          hint={`${statusFilter} only — not total sales`}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleOrders.map((order, idx) => (
            <OrderCard
              key={`${order.table_reference_id}-${idx}`}
              order={order}
              index={idx}
              menuOpen={openMenuFor === order.table_reference_id}
              onToggleMenu={() =>
                setOpenMenuFor((prev) =>
                  prev === order.table_reference_id
                    ? null
                    : order.table_reference_id,
                )
              }
              onChangeStatus={changeStatus}
              onPrint={printReceipt}
              printing={printingFor === order.table_reference_id}
              onSettle={setPendingSettle}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingSettle)}
        onClose={() => setPendingSettle(null)}
        onConfirm={settleOrder}
        loading={settling}
        title="Mark order as paid"
        confirmLabel="Mark paid"
        tone="primary"
        message={
          <>
            This closes{" "}
            <span className="font-semibold text-ink-900">
              {pendingSettle?.tableName}
            </span>{" "}
            for{" "}
            <span className="font-semibold text-ink-900">
              {money(pendingSettle?.total_price)}
            </span>{" "}
            and frees the table. Only do this once the customer has actually
            paid — it can&apos;t be undone from here.
          </>
        }
      />
    </PageShell>
  );
}

function OrderCard({
  order,
  index,
  menuOpen,
  onToggleMenu,
  onChangeStatus,
  onPrint,
  onSettle,
  printing,
}) {
  const closed = order.status === "Cancelled" || order.status === "Paid";

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          ACCENT[order.status] ?? "bg-ink-300",
        )}
      />

      <header className="flex items-start justify-between gap-2 border-b border-ink-100 px-4 py-3 pl-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-ink-400">
              #{index + 1}
            </span>
            <h3 className="truncate text-sm font-bold text-ink-900">
              {order.tableName}
            </h3>
          </div>
          <p className="mt-0.5 text-2xs text-ink-500 tabular-nums">
            {formatNepalTime(order.created_at)}
          </p>
        </div>

        {/* The old card printed the *filter* value here rather than the order's
            own status, so a card could contradict its own colour. */}
        <StatusBadge status={order.status} />
      </header>

      <div className="flex-1 px-4 py-3 pl-5">
        <ul className="space-y-1.5">
          {order.items.map((item, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 text-ink-700">
                <span className="mr-1.5 font-bold text-ink-400 tabular-nums">
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

      <footer className="border-t border-ink-100 px-4 py-3 pl-5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
            Total
          </span>
          <span className="text-base font-bold tabular-nums text-ink-900">
            {money(order.total_price)}
          </span>
        </div>

        {closed ? (
          <div className="flex items-center justify-between gap-2">
            <Badge tone={order.status === "Cancelled" ? "danger" : "neutral"}>
              {order.status === "Cancelled" ? "Cancelled" : "Paid & closed"}
            </Badge>
            {order.status === "Paid" && (
              <Button
                size="sm"
                variant="ghost"
                icon={RotateCcw}
                loading={printing}
                onClick={() => onPrint(order)}
              >
                Reprint
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Print is now read-only — it opens the receipt and changes
                nothing. Settling is the separate button below. */}
            <Button
              size="sm"
              variant="secondary"
              icon={Printer}
              loading={printing}
              onClick={() => onPrint(order)}
              className="flex-1"
            >
              Print bill
            </Button>

            <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="secondary"
                iconRight={ChevronDown}
                onClick={onToggleMenu}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                Status
              </Button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-full right-0 z-30 mb-1.5 w-40 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop animate-pop-in"
                >
                  {NEXT_STATUSES.filter((s) => s !== order.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="menuitem"
                      onClick={() => onChangeStatus(order, s)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer",
                        s === "Cancelled"
                          ? "font-semibold text-danger-600 hover:bg-danger-50"
                          : "text-ink-700 hover:bg-ink-50",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!closed && (
          <Button
            size="sm"
            variant="primary"
            icon={BadgeCheck}
            onClick={() => onSettle(order)}
            className="mt-2 w-full"
          >
            Mark paid &amp; close
          </Button>
        )}
      </footer>
    </article>
  );
}

/* ==========================================================================
   Receipt rendering
   Every figure below comes from GET bill/ — the client never computes bill
   totals, so what prints always matches what build_bill() will charge.
   ========================================================================== */

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const rupees = (value) => Math.round(Number(value ?? 0)).toLocaleString();

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
  .sum.discount { color: #0f7b3a; }
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

/** Written into the popup immediately, while GET bill/ is in flight. */
const loadingDocument = () =>
  receiptShell("Preparing bill…", '<div class="wait">Preparing bill…</div>');

const errorDocument = (message) =>
  receiptShell(
    "Bill unavailable",
    `<div class="wait">${escapeHtml(message)}<br /><br />Close this window and try again.</div>`,
  );

function receiptDocument(bill, fallback) {
  const restaurant = bill.restaurantName || fallback.restaurant || "Cafe";
  const branch = bill.branchName || fallback.branch || "";
  const opened = stampNepal(bill.openedAt);
  const printed =
    stampNepal(bill.printedAt) ?? stampNepal(new Date().toISOString());
  const hasDiscount = Number(bill.discount) > 0;

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
        <div class="sum"><span>Sub total</span><span>Rs. ${rupees(bill.subTotal)}</span></div>
        ${
          hasDiscount
            ? `<div class="sum discount"><span>Discount</span><span>− Rs. ${rupees(bill.discount)}</span></div>`
            : ""
        }
      </div>
      <div class="total"><span>Total</span><span>Rs. ${rupees(bill.grandTotal)}</span></div>
      <div class="foot">
        <div class="thanks">Thank you!</div>
        <div class="sub">We hope to see you again</div>
      </div>
    </div>`,
  );
}
