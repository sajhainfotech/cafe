"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ImagePlus,
  Pencil,
  Plus,
  SquareMenu,
  Trash2,
  Upload,
} from "lucide-react";

import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import SearchSelect from "@/components/ui/SearchSelect";
import ImageThumb from "@/components/ui/ImageThumb";
import Badge from "@/components/ui/Badge";
import { authHeader, getAuthToken } from "@/lib/cookies";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_IMAGE_BYTES = 1024 * 1024;

const emptyItem = () => ({
  name: "",
  price: "",
  item_category: "",
  unit: "",
  imageFile: null,
  imagePreview: null,
});

const money = (value) =>
  value === "" || value == null ? "—" : `Rs ${Number(value).toLocaleString()}`;

export default function AdminMenuManager() {
  const [menus, setMenus] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuDate, setMenuDate] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({ menu_date: "", items: [] });
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadedLookups = useRef(false);

  /* ---------------------------------------------------------------- fetching */

  const fetchMenus = async () => {
    if (!getAuthToken()) return;
    setFetching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/menus/?page=${page}&page_size=${rowsPerPage}`,
        { headers: authHeader() },
      );
      const data = await res.json();
      setMenus(data.data?.results || []);
      setTotalCount(data.data?.count || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load menu items");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (loadedLookups.current || !getAuthToken()) return;
    loadedLookups.current = true;

    const load = async (path, setter, label) => {
      try {
        const res = await fetch(`${API_URL}${path}`, { headers: authHeader() });
        const data = await res.json();
        setter(data.data?.results || data.data || []);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to load ${label}`);
      }
    };

    // page_size is large here on purpose: these feed dropdowns, not a table.
    load("/api/units/?page=1&page_size=200", setUnits, "units");
    load("/api/item-categories/", setCategories, "categories");
  }, []);

  /* ------------------------------------------------------- name resolution */

  /** The API returns these as an id string, a nested object, or "object (12)". */
  const resolveName = (value, list) => {
    if (!value) return null;

    if (typeof value === "object") {
      if (value.name) return value.name;
      const id = value.reference_id ?? value.id;
      const hit = list.find(
        (x) => x.reference_id === id || String(x.id) === String(id),
      );
      return hit?.name ?? null;
    }

    const direct = list.find((x) => x.reference_id === value);
    if (direct) return direct.name;

    const embedded = String(value).match(/\((\d+)\)/)?.[1];
    if (embedded) {
      const hit = list.find(
        (x) => String(x.id) === embedded || x.reference_id === embedded,
      );
      if (hit) return hit.name;
    }

    return null;
  };

  const idOf = (value) =>
    typeof value === "object" && value !== null
      ? (value.reference_id ?? value.id ?? "")
      : (value ?? "");

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.reference_id, label: c.name })),
    [categories],
  );
  const unitOptions = useMemo(
    () => units.map((u) => ({ value: u.reference_id, label: u.name })),
    [units],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!Array.isArray(menus)) return [];
    if (!q) return menus;
    return menus.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        resolveName(m.item_category, categories)?.toLowerCase().includes(q),
    );
  }, [menus, search, categories]);

  /* ------------------------------------------------------------ form state */

  const openCreate = () => {
    setEditingMenuId(null);
    setMenuDate("");
    setItems([emptyItem()]);
    setErrors({ menu_date: "", items: [] });
    setShowForm(true);
  };

  const openEdit = (menu) => {
    setEditingMenuId(menu.reference_id);
    setMenuDate(menu.menu_date || "");
    setItems([
      {
        name: menu.name || "",
        price: menu.price ?? "",
        item_category: idOf(menu.item_category),
        unit: idOf(menu.unit),
        imageFile: null,
        imagePreview: menu.image || menu.image_url || null,
      },
    ]);
    setErrors({ menu_date: "", items: [] });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMenuId(null);
    setItems([emptyItem()]);
    setErrors({ menu_date: "", items: [] });
  };

  const setItemField = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
    setErrors((prev) => {
      const nextItems = [...prev.items];
      if (nextItems[index]?.[field]) {
        nextItems[index] = { ...nextItems[index], [field]: "" };
      }
      return { ...prev, items: nextItems };
    });
  };

  const pickImage = (index, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 1 MB");
      return;
    }

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              imageFile: file,
              imagePreview: URL.createObjectURL(file),
            }
          : item,
      ),
    );
    setErrors((prev) => {
      const nextItems = [...prev.items];
      if (nextItems[index]?.image) {
        nextItems[index] = { ...nextItems[index], image: "" };
      }
      return { ...prev, items: nextItems };
    });
  };

  // Carry the previous row's category and unit forward: when you're entering
  // ten drinks in a row, those two columns are almost always the same.
  const addItem = () =>
    setItems((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          ...emptyItem(),
          item_category: last?.item_category ?? "",
          unit: last?.unit ?? "",
        },
      ];
    });
  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const next = { menu_date: "", items: [] };
    let ok = true;

    if (!menuDate) {
      next.menu_date = "Pick the date this menu applies to";
      ok = false;
    }

    items.forEach((item) => {
      const itemErrors = {};

      if (!item.name?.trim()) {
        itemErrors.name = "Required";
        ok = false;
      }

      if (item.price === "" || item.price == null) {
        itemErrors.price = "Required";
        ok = false;
      } else if (Number.isNaN(Number(item.price))) {
        itemErrors.price = "Must be a number";
        ok = false;
      } else if (Number(item.price) <= 0) {
        itemErrors.price = "Must be above 0";
        ok = false;
      }

      if (!item.item_category) {
        itemErrors.item_category = "Required";
        ok = false;
      }
      if (!item.unit) {
        itemErrors.unit = "Required";
        ok = false;
      }
      if (!editingMenuId && !item.imageFile) {
        itemErrors.image = "Image required";
        ok = false;
      }

      next.items.push(itemErrors);
    });

    setErrors(next);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Check the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("menu_date", menuDate);

      if (editingMenuId) {
        const item = items[0];
        payload.append("name", item.name.trim());
        payload.append("price", item.price);
        payload.append("item_category", item.item_category);
        payload.append("unit", item.unit);
        if (item.imageFile) payload.append("image", item.imageFile);
      } else {
        items.forEach((item, i) => {
          payload.append(`items[${i}][name]`, item.name.trim());
          payload.append(`items[${i}][price]`, item.price);
          payload.append(`items[${i}][item_category]`, item.item_category);
          payload.append(`items[${i}][unit]`, item.unit);
          if (item.imageFile)
            payload.append(`items[${i}][image]`, item.imageFile);
        });
      }

      const res = await fetch(
        editingMenuId
          ? `${API_URL}/api/menus/${editingMenuId}/`
          : `${API_URL}/api/menus/`,
        {
          method: editingMenuId ? "PATCH" : "POST",
          headers: authHeader(),
          body: payload,
        },
      );

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Unexpected response from the server");
      }

      if (!res.ok || data.response_code !== "0") {
        throw new Error(data.message || "Failed to save the menu");
      }

      toast.success(
        editingMenuId
          ? "Menu item updated"
          : `${items.length} item${items.length > 1 ? "s" : ""} added`,
      );
      closeForm();
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/menus/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      if (!res.ok) throw new Error("Could not delete this item");

      toast.success("Menu item deleted");
      fetchMenus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  /* ---------------------------------------------------------------- columns */

  const columns = [
    {
      header: "S.N.",
      width: "68px",
      render: (_row, i) => (
        <span className="text-ink-400">{(page - 1) * rowsPerPage + i + 1}</span>
      ),
    },
    {
      header: "Item",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <ImageThumb
            src={row.image || row.image_url}
            alt={row.name}
            size={36}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{row.name}</p>
            <p className="text-2xs text-ink-500">
              {resolveName(row.unit, units) ?? "No unit"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (row) => {
        const name = resolveName(row.item_category, categories);
        return name ? (
          <Badge tone="neutral">{name}</Badge>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      header: "Price",
      align: "right",
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink-900">
          {money(row.price)}
        </span>
      ),
    },
    {
      header: "Menu date",
      render: (row) => (
        <span className="tabular-nums text-ink-600">
          {row.menu_date || "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      width: "96px",
      align: "right",
      render: (row) => (
        <RowActions>
          <IconButton
            icon={Pencil}
            label={`Edit ${row.name}`}
            size="sm"
            onClick={() => openEdit(row)}
            variant="ghost-brand"
          />
          <IconButton
            icon={Trash2}
            label={`Delete ${row.name}`}
            size="sm"
            onClick={() => setPendingDelete(row)}
            variant="ghost-danger"
          />
        </RowActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Menu"
        subtitle="Dishes customers see when they scan a table QR code."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search menu items…"
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add items
          </Button>
        }
      />

      <DataTable
        data={visible}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={SquareMenu}
        emptyTitle="No menu items yet"
        emptyDescription="Add dishes with a price, category and photo."
        emptyAction={
          <Button icon={Plus} size="sm" onClick={openCreate}>
            Add items
          </Button>
        }
      />

      {totalCount > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalCount={totalCount}
        />
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingMenuId ? "Edit menu item" : "Add menu items"}
        description={
          editingMenuId
            ? undefined
            : "Add several dishes at once — they'll share the menu date."
        }
        size="2xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} type="submit" form="menu-form">
              {editingMenuId
                ? "Update item"
                : `Create ${items.length} item${items.length > 1 ? "s" : ""}`}
            </Button>
          </>
        }
      >
        <form
          id="menu-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <Field
            label="Menu date"
            required
            error={errors.menu_date}
            className="max-w-52"
          >
            {(props) => (
              <Input
                {...props}
                type="date"
                value={menuDate}
                onChange={(e) => {
                  setMenuDate(e.target.value);
                  if (errors.menu_date)
                    setErrors((prev) => ({ ...prev, menu_date: "" }));
                }}
              />
            )}
          </Field>

          <div className="overflow-hidden rounded-lg border border-ink-300">
            <ItemGridHeader imageRequired={!editingMenuId} />

            {items.map((item, idx) => (
              <ItemRow
                key={idx}
                index={idx}
                item={item}
                errors={errors.items[idx] ?? {}}
                categoryOptions={categoryOptions}
                unitOptions={unitOptions}
                onChange={setItemField}
                onPickImage={pickImage}
                onRemove={items.length > 1 ? () => removeItem(idx) : null}
                imageRequired={!editingMenuId}
              />
            ))}

            {!editingMenuId && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-ink-50 px-3 py-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={addItem}
                >
                  Add row
                </Button>
                <p className="text-2xs text-ink-500">
                  {items.length} row{items.length > 1 ? "s" : ""} · new rows
                  reuse the category and unit above
                </p>
              </div>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        itemName={pendingDelete?.name}
        loading={deleting}
        title="Delete menu item"
      />
    </PageShell>
  );
}

/* ==========================================================================
   Bulk-entry grid
   A real table on md+ (headers once, tab straight across a row) that reflows
   into labelled blocks on narrow screens, where seven columns can't fit.
   One markup, two layouts — the column template is shared below.
   ========================================================================== */

const GRID =
  "md:grid md:items-start md:gap-2 " +
  "md:grid-cols-[42px_56px_minmax(140px,1fr)_100px_minmax(140px,185px)_minmax(105px,145px)_32px]";

function Th({ children, className }) {
  return (
    <span
      className={cn(
        "text-2xs font-bold uppercase tracking-wider text-ink-500",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Required() {
  return (
    <span className="text-danger-600" aria-hidden="true">
      *
    </span>
  );
}

function ItemGridHeader({ imageRequired }) {
  return (
    <div
      className={cn("hidden border-b border-ink-300 bg-ink-50 px-3 py-2", GRID)}
    >
      <Th>S.N.</Th>
      <Th>
        Img
        {imageRequired && <Required />}
      </Th>
      <Th>
        Name <Required />
      </Th>
      <Th>
        Price <Required />
      </Th>
      <Th>
        Category <Required />
      </Th>
      <Th>
        Unit <Required />
      </Th>
      <Th className="sr-only">Remove</Th>
    </div>
  );
}

/**
 * One dish. Cells carry their own aria-label because on md+ the visible label
 * lives in the header row, out of each control's accessible name.
 */
function ItemRow({
  index,
  item,
  errors,
  categoryOptions,
  unitOptions,
  onChange,
  onPickImage,
  onRemove,
  imageRequired,
}) {
  const imageInputId = `item-${index}-image`;
  const position = index + 1;

  return (
    <div
      className={cn(
        "border-b border-ink-200 px-3 py-3 last:border-b-0 md:py-2",
        "space-y-2.5 md:space-y-0",
        "odd:bg-white even:bg-ink-50/40",
        GRID,
      )}
    >
      {/* Row number — a heading on mobile, a plain cell in the grid */}
      <div className="flex items-center justify-between md:h-9 md:justify-start">
        <span className="text-2xs font-bold uppercase tracking-wider text-ink-400 md:normal-case md:tracking-normal md:text-ink-400">
          <span className="md:hidden">Item {position}</span>
          <span className="hidden md:inline">{position}</span>
        </span>
        {onRemove && (
          <span className="md:hidden">
            <IconButton
              icon={Trash2}
              label={`Remove item ${position}`}
              size="sm"
              onClick={onRemove}
              variant="ghost-danger"
            />
          </span>
        )}
      </div>

      {/* Photo */}
      <Cell label="Photo" error={errors.image}>
        <label
          htmlFor={imageInputId}
          className={cn(
            "group relative grid size-14 cursor-pointer place-items-center overflow-hidden rounded-md border-2 border-dashed bg-white transition-colors md:size-9",
            errors.image
              ? "border-danger-600"
              : "border-ink-300 hover:border-brand-500",
          )}
        >
          {item.imagePreview ? (
            <>
              <img
                src={item.imagePreview}
                alt=""
                className="size-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-ink-900/55 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="size-3.5 text-white" aria-hidden="true" />
              </span>
            </>
          ) : (
            <ImagePlus className="size-4 text-ink-400" aria-hidden="true" />
          )}
        </label>
        <input
          id={imageInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`Photo for item ${position}${imageRequired ? " (required)" : ""}`}
          onChange={(e) => onPickImage(index, e.target.files?.[0])}
        />
      </Cell>

      <Cell label="Name" error={errors.name}>
        <Input
          value={item.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Chicken Momo"
          aria-label={`Name for item ${position}`}
          invalid={Boolean(errors.name)}
        />
      </Cell>

      <Cell label="Price" error={errors.price}>
        <Input
          inputMode="decimal"
          value={item.price}
          onChange={(e) => onChange(index, "price", e.target.value)}
          placeholder="180"
          aria-label={`Price for item ${position}`}
          invalid={Boolean(errors.price)}
          className="tabular-nums"
        />
      </Cell>

      <Cell label="Category" error={errors.item_category}>
        <SearchSelect
          value={item.item_category}
          onChange={(value) => onChange(index, "item_category", value)}
          options={categoryOptions}
          placeholder="Category"
          aria-label={`Category for item ${position}`}
          invalid={Boolean(errors.item_category)}
        />
      </Cell>

      <Cell label="Unit" error={errors.unit}>
        <SearchSelect
          value={item.unit}
          onChange={(value) => onChange(index, "unit", value)}
          options={unitOptions}
          placeholder="Unit"
          aria-label={`Unit for item ${position}`}
          invalid={Boolean(errors.unit)}
        />
      </Cell>

      {/* Remove — mobile shows it beside the row heading instead */}
      <div className="hidden md:flex md:h-9 md:items-center">
        {onRemove && (
          <IconButton
            icon={Trash2}
            label={`Remove item ${position}`}
            size="sm"
            onClick={onRemove}
            variant="ghost-danger"
          />
        )}
      </div>
    </div>
  );
}

/** Grid cell: label shows only where the header row is hidden. */
function Cell({ label, error, children }) {
  return (
    <div className="min-w-0">
      {label && (
        <span className="mb-1 block text-2xs font-semibold text-ink-600 md:hidden">
          {label}
        </span>
      )}
      {children}
      {error && (
        <p className="mt-1 text-[10px] font-medium text-danger-600">{error}</p>
      )}
    </div>
  );
}
