"use client";

/**
 * Thermal-receipt PDF generator — no dependencies.
 *
 * A receipt is monospaced text and a few rules, and PDF's base-14 fonts
 * (Courier here) need no embedding, so the whole document can be emitted
 * directly. jsPDF would add ~350 KB to a bundle that was just cut from 34
 * dependencies to 9, and html2canvas would rasterise the bill — a blurry image
 * with no selectable text, which is the wrong artefact for an invoice.
 *
 * Output is 80 mm wide (227 pt), the standard thermal roll, with the page
 * growing to fit the item count.
 */

const PAGE_WIDTH = 227; // 80mm at 72dpi
const MARGIN = 10;
const BODY_SIZE = 8;
const LINE = 10;
/* Courier advance width is exactly 0.6 em at any size — the whole layout
   below depends on that, which is why the font is not configurable. */
const ADVANCE = 0.6;
const COLS = Math.floor((PAGE_WIDTH - MARGIN * 2) / (BODY_SIZE * ADVANCE));

const NAME_COL = COLS - 22;
const QTY_COL = 4;
const RATE_COL = 8;
const AMOUNT_COL = 10;

/* ---------------------------------------------------------------- helpers -- */

/** PDF strings are latin-1; drop anything that isn't printable ASCII. */
const asciify = (value) =>
  String(value ?? "")
    .replace(/₨/g, "Rs")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/×/g, "x")
    .replace(/[^\x20-\x7E]/g, "");

const escapePdf = (value) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const money = (value) => Math.round(Number(value ?? 0)).toLocaleString("en-US");

const padRight = (text, width) =>
  text.length > width ? text.slice(0, width) : text.padEnd(width, " ");
const padLeft = (text, width) =>
  text.length > width ? text.slice(-width) : text.padStart(width, " ");

/** Break a name that overflows its column onto continuation lines. */
function wrap(text, width) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!current.length) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
    while (current.length > width) {
      lines.push(current.slice(0, width));
      current = current.slice(width);
    }
  }
  if (current.length) lines.push(current);
  return lines.length ? lines : [""];
}

/* ----------------------------------------------------------------- layout -- */

/**
 * Timestamps arrive as ISO strings, so the caller passes them already formatted
 * in Nepal time — the same strings the on-screen receipt shows.
 */
function layout(bill, { restaurant, branch, openedLabel, printedLabel }) {
  const rows = [];
  let top = MARGIN;

  const text = (value, { size = BODY_SIZE, bold = false, center = false } = {}) => {
    rows.push({ kind: "text", text: asciify(value), size, bold, center, top });
    top += size <= BODY_SIZE ? LINE : size + 3;
  };
  const rule = () => {
    top += 2;
    rows.push({ kind: "rule", top });
    top += 6;
  };
  const gap = (height = 4) => {
    top += height;
  };

  // A reprint of a settled bill must be identifiable as a copy, so it can't be
  // passed off as a second sale.
  if (bill.isReprint) {
    text("*** DUPLICATE ***", { bold: true, center: true });
  }

  text(restaurant || "Cafe", { size: 11, bold: true, center: true });
  if (branch) text(branch.toUpperCase(), { center: true });
  rule();

  const meta = (label, value) =>
    text(padRight(label, 10) + padLeft(String(value ?? "-"), COLS - 10));

  meta("Table", bill.tableNumber ?? "-");
  if (openedLabel) meta("Opened", openedLabel);
  if (printedLabel) meta("Billed", printedLabel);
  rule();

  text(
    padRight("ITEM", NAME_COL) +
      padLeft("QTY", QTY_COL) +
      padLeft("RATE", RATE_COL) +
      padLeft("AMOUNT", AMOUNT_COL),
  );
  gap(2);

  for (const item of bill.items) {
    const nameLines = wrap(asciify(item.name), NAME_COL);
    text(
      padRight(nameLines[0], NAME_COL) +
        padLeft(String(item.quantity), QTY_COL) +
        padLeft(money(item.unitPrice), RATE_COL) +
        padLeft(money(item.totalPrice), AMOUNT_COL),
    );
    // Continuation lines carry only the name; the figures belong to the first.
    for (const extra of nameLines.slice(1)) text(padRight(extra, NAME_COL));
  }

  rule();

  const sum = (label, value) =>
    text(padRight(label, COLS - 12) + padLeft(value, 12));

  sum("Sub total", `Rs. ${money(bill.subTotal)}`);
  if (Number(bill.discount) > 0) {
    sum("Discount", `- Rs. ${money(bill.discount)}`);
  }
  gap(2);
  rule();
  text(padRight("TOTAL", COLS - 12) + padLeft(`Rs. ${money(bill.grandTotal)}`, 12), {
    bold: true,
  });

  gap(6);
  rule();
  text("Thank you!", { bold: true, center: true });
  text("We hope to see you again", { center: true });

  return { rows, height: top + MARGIN };
}

/* ------------------------------------------------------------------ emit --- */

function contentStream(rows, height) {
  const ops = [];

  for (const row of rows) {
    if (row.kind === "rule") {
      const lineY = (height - row.top).toFixed(2);
      ops.push(
        "q 0.5 w [2 2] 0 d",
        `${MARGIN} ${lineY} m ${PAGE_WIDTH - MARGIN} ${lineY} l S`,
        "Q",
      );
      continue;
    }

    const baseline = (height - row.top - row.size).toFixed(2);
    const width = row.text.length * row.size * ADVANCE;
    const x = row.center ? ((PAGE_WIDTH - width) / 2).toFixed(2) : MARGIN;

    ops.push(
      "BT",
      `/${row.bold ? "F2" : "F1"} ${row.size} Tf`,
      `1 0 0 1 ${x} ${baseline} Tm`,
      `(${escapePdf(row.text)}) Tj`,
      "ET",
    );
  }

  return ops.join("\n");
}

/** Assemble the object table, xref and trailer. */
function assemble(stream, height) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${height.toFixed(2)}] ` +
      `/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF\n`;

  return pdf;
}

/* ------------------------------------------------------------------ public - */

/** The raw PDF document as a string. Exported so it can be tested headlessly. */
export function buildReceiptPdfString(bill, context = {}) {
  const { rows, height } = layout(bill, context);
  return assemble(contentStream(rows, height), height);
}

export function buildReceiptPdfBlob(bill, context = {}) {
  const pdf = buildReceiptPdfString(bill, context);
  // latin1: every byte must map 1:1, or the xref offsets stop matching.
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}
