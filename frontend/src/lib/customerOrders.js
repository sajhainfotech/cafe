"use client";

/**
 * Order history for the customer-facing QR menu.
 *
 * Two sources, in priority order:
 *
 *  1. The server, via a token-scoped read endpoint (see CONTRACT below). This is
 *     authoritative: it carries real kitchen status and includes orders placed
 *     from other phones at the same table.
 *  2. localStorage, per table token. Works with no backend change, but only
 *     knows what THIS device sent and cannot know status.
 *
 * The fetch probes once; on 404/401/403 it flips to `supported: false` and the
 * caller stops asking, so a missing endpoint costs exactly one request.
 *
 * ── CONTRACT for the backend ────────────────────────────────────────────────
 * GET {API_URL}/api/order-scan/orders/?token=<table_token>     (no auth)
 *
 * Deliberately shaped like the existing admin /api/orders-list/ response so the
 * same serializer can be reused:
 *
 *   { "code": "0", "data": [
 *       { "reference_id": "…",
 *         "status": "pending|preparing|ready|served|paid|cancelled",
 *         "order_time": "2026-08-11T09:15:00Z",
 *         "grand_total": 440,
 *         "items": [ { "menu_name": "Chicken Momo",
 *                      "total_quantity": 2,
 *                      "total_price": 360 } ] } ] }
 *
 * Must scope results to the table the token belongs to, and must NOT require an
 * admin token. If your route differs, set NEXT_PUBLIC_CUSTOMER_ORDERS_PATH
 * instead of editing this file.
 * ───────────────────────────────────────────────────────────────────────────
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORDERS_PATH =
  process.env.NEXT_PUBLIC_CUSTOMER_ORDERS_PATH || "/api/order-scan/orders/";

/* ------------------------------------------------------------------ local -- */

const historyKey = (token) => `cafe:orders:${token}`;

/**
 * How long one visit lasts.
 *
 * The storage key is the table token, which never changes — so without a cutoff
 * the list accumulates every visit this phone has ever made to that table, and
 * a diner sees last week's paid meal alongside today's. A restaurant "visit"
 * ends at payment, but the client can't see that (no token-scoped read
 * endpoint), so elapsed time is the honest local approximation. Once the server
 * endpoint exists it returns only the open session and this stops mattering.
 */
const VISIT_WINDOW_MS = 6 * 60 * 60 * 1000;

const withinVisit = (order) => {
  const placed = Date.parse(order?.placedAt ?? "");
  if (Number.isNaN(placed)) return false;
  return Date.now() - placed < VISIT_WINDOW_MS;
};

export function readHistory(token) {
  if (typeof window === "undefined" || !token) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(historyKey(token)));
    return Array.isArray(parsed) ? parsed.filter(withinVisit) : [];
  } catch {
    return [];
  }
}

export function writeHistory(token, orders) {
  if (typeof window === "undefined" || !token) return;
  try {
    // Drop expired visits on write too, so storage doesn't grow forever on a
    // regular's phone.
    window.localStorage.setItem(
      historyKey(token),
      JSON.stringify(orders.filter(withinVisit).slice(0, 20)),
    );
  } catch {
    // Private mode or quota exceeded: history just won't persist.
  }
}

/* ----------------------------------------------------------------- server -- */

/**
 * @returns {Promise<{supported: boolean|null, orders: object[]}>}
 *   supported === false  → endpoint isn't there; stop polling, use local
 *   supported === null   → transient failure; keep whatever you had
 *   supported === true   → `orders` is authoritative
 */
export async function fetchTableOrders(token) {
  if (!token) return { supported: false, orders: [] };

  let res;
  try {
    res = await fetch(
      `${API_URL}${ORDERS_PATH}?token=${encodeURIComponent(token)}`,
      { headers: { Accept: "application/json" } },
    );
  } catch {
    // Offline or CORS — don't conclude the endpoint is missing.
    return { supported: null, orders: [] };
  }

  // Not built yet, or gated behind auth: treat as unavailable, permanently.
  if (res.status === 404 || res.status === 401 || res.status === 403) {
    return { supported: false, orders: [] };
  }
  if (!res.ok) return { supported: null, orders: [] };

  let payload;
  try {
    payload = await res.json();
  } catch {
    return { supported: false, orders: [] };
  }

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.results)
        ? payload.data.results
        : null;

  // 200 with a shape we don't recognise means the contract isn't met.
  if (!rows) return { supported: false, orders: [] };

  return { supported: true, orders: rows.map(normalizeOrder) };
}

/** Server row → the same shape the local records use, plus a real status. */
function normalizeOrder(row) {
  return {
    id: row.reference_id ?? row.id ?? row.order_time,
    placedAt: row.order_time ?? row.created_at ?? null,
    status: String(row.status ?? "pending").toLowerCase(),
    total: Number(row.grand_total ?? row.total_price ?? 0),
    items: (Array.isArray(row.items) ? row.items : []).map((item) => ({
      name: item.menu_name ?? item.name ?? "Item",
      quantity: Number(item.total_quantity ?? item.quantity ?? 0),
      total_price: Number(item.total_price ?? 0),
    })),
  };
}

/* ------------------------------------------------------------------ labels -- */

/**
 * Customer-facing wording. Staff see "Pending"; a diner should read what it
 * means for them, so the internal vocabulary is not shown here.
 */
export const CUSTOMER_STATUS = {
  pending: { label: "Sent to kitchen", tone: "warning" },
  preparing: { label: "Being prepared", tone: "info" },
  ready: { label: "Ready to serve", tone: "brand" },
  served: { label: "Served", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const statusMeta = (status) =>
  CUSTOMER_STATUS[String(status ?? "").toLowerCase()] ?? {
    label: "Sent to kitchen",
    tone: "warning",
  };
