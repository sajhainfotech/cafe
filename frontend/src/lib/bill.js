"use client";

import { authHeader } from "./cookies";
import { apiUrl } from "./utils";

/**
 * Bill fetching for the order screen.
 *
 * ── The two endpoints ───────────────────────────────────────────────────────
 *   GET   api/table/<table_reference_id>/bill/         read-only, safe to repeat
 *   PATCH api/table/<table_reference_id>/bill-print/   settles + marks paid
 *
 * Both run the same build_bill() server-side, so the printed figures and the
 * charged figures can't diverge. That's why printing no longer settles: the
 * client never computes bill totals itself.
 *
 * ── Assumed response shape ──────────────────────────────────────────────────
 *   { "response_code": "0", "data": {
 *       "table_number": 4,
 *       "restaurant_name": "…", "branch_name": "…",
 *       "opened_at": "…", "printed_at": "…",
 *       "items": [ { "name": "Chicken Momo", "quantity": 2,
 *                    "unit_price": 180, "total_price": 360 } ],
 *       "sub_total": 440, "discount": 40, "grand_total": 400 } }
 *
 * Field names are read through pick() below, which accepts the plausible
 * variants. If yours differ, add the alias there — it's the only place that
 * needs to change.
 */

/** First key that's actually present, else `fallback`. */
const pick = (source, keys, fallback = null) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

/**
 * @param paidAt ISO timestamp identifying one settled sitting. Omit for the
 *   table's current bill (or its most recent, if nothing is open). A table is
 *   billed repeatedly through the day, so reprinting the *right* one means
 *   naming the batch rather than always taking the latest.
 */
export async function fetchBill(tableReferenceId, paidAt = null) {
  const query = paidAt ? `?paid_at=${encodeURIComponent(paidAt)}` : "";
  const res = await fetch(
    apiUrl(`/api/table/${tableReferenceId}/bill/${query}`),
    { headers: { ...authHeader(), Accept: "application/json" } },
  );

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      pick(payload, ["message", "detail", "response"]) ||
        `Couldn't load the bill (HTTP ${res.status})`,
    );
  }

  const data = payload?.data ?? payload;
  if (!data) throw new Error("The bill response was empty");

  return normalizeBill(data);
}

export function normalizeBill(data) {
  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.line_items)
      ? data.line_items
      : [];

  const items = rawItems.map((item) => {
    const quantity = Number(
      pick(item, ["quantity", "total_quantity", "qty"], 0),
    );
    const total = Number(pick(item, ["total_price", "amount", "total"], 0));
    // Server sends unit price; derive it only if it's genuinely absent.
    const unit = Number(
      pick(
        item,
        ["unit_price", "price", "item_price", "rate"],
        quantity ? total / quantity : 0,
      ),
    );

    return {
      name: pick(item, ["name", "menu_name", "item_name"], "Item"),
      unitName: pick(item, ["unit_name", "unit"], ""),
      quantity,
      unitPrice: unit,
      totalPrice: total,
    };
  });

  const subTotal = Number(
    pick(data, ["sub_total", "subtotal", "sub_amount"], 0),
  );
  const discount = Number(pick(data, ["discount", "discount_amount"], 0));
  const grandTotal = Number(
    pick(data, ["grand_total", "total", "net_total"], subTotal - discount),
  );

  return {
    tableNumber: pick(data, ["table_number", "table"], null),
    restaurantName: pick(data, ["restaurant_name", "restaurant"], ""),
    branchName: pick(data, ["branch_name", "branch"], ""),
    // Set when the table is already settled and the server rebuilt the bill
    // from the last paid batch. The copy gets stamped DUPLICATE.
    isReprint: Boolean(pick(data, ["is_reprint"], false)),
    paidAt: pick(data, ["paid_at"]),
    // "Both timestamps": when the table's first order landed, and when the bill
    // was produced.
    openedAt: pick(data, [
      "opened_at",
      "first_order_time",
      "order_time",
      "created_at",
      "order_start_time",
    ]),
    printedAt: pick(data, [
      "printed_at",
      "bill_time",
      "last_order_time",
      "updated_at",
      "order_end_time",
    ]),
    items,
    subTotal: subTotal || items.reduce((sum, i) => sum + i.totalPrice, 0),
    discount,
    grandTotal,
  };
}
