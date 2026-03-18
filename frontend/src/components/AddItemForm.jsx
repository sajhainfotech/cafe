"use client";
import { Select } from "antd"; // Make sure to import this at the top
import { Trash2, Edit2, X, Plus, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ToastProvider from "./ToastProvider";
import { useRef } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import "../styles/customButtons.css";
import MenuImageHover from "./ImageHover";
import HeaderWithSearch from "./HeaderWithSearch";
import DeleteModal from "./DeleteModal";
import TableModal from "./CustomTable";
import CustomTable from "./CustomTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function AdminMenuManager() {
  const formRef = useRef(null);
  const [units, setUnits] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [menus, setMenus] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteMenu, setDeleteMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [openUnitDropdownIdx, setOpenUnitDropdownIdx] = useState(null);
  const isFetched = useRef(false);
  const [form, setForm] = useState({
    menu_date: "",
    categories: [
      { name: "", price: "", item_category: "", unit: "", imageFile: null },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const columns = [
    {
      header: "S.N.",
      width: "40px",
      render: (_, index) => index + 1,
    },
    {
      header: "Date",
      accessor: "menu_date",
    },
    {
      header: "Name",
      render: (row) => row.name,
    },
    {
      header: "Price",
      render: (row) => row.price,
    },
    {
      header: "Category",
      render: (row) => getCategoryName(row.item_category),
    },
    {
      header: "Unit",
      render: (row) => getUnitName(row.unit),
    },
    {
      header: "Image",
      render: (row) => (
        <div className="w-6 h-6 overflow-hidden mx-auto">
          <MenuImageHover src={row.image || row.image_url} />
        </div>
      ),
    },
    {
      header: "Action",
      width: "80px",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleEditMenu(row)}
            className="text-blue-500 hover:scale-110 transition cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setDeleteMenu(row);
              setShowDeleteModal(true);
            }}
            className="text-red-500 hover:scale-110 transition cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const resetForm = () => {
    setForm({
      menu_date: "",
      categories: [
        {
          name: "",
          price: "",
          item_category: "",
          unit: "",
          imageFile: null,
          imagePreview: null,
        },
      ],
    });
    setEditingMenuId(null);
  };

  // --- Fetch Units & Categories ---
  const fetchUnits = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/units/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setUnits(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch units");
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/item-categories/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setCategoriesList(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch categories");
    }
  };

  const fetchMenus = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/menus/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      console.log("Menus API Data:", data);
      if (data.data && data.data.length > 0) {
        console.log("Sample menu item_category:", data.data[0].item_category);
        console.log(
          "Sample menu item_category type:",
          typeof data.data[0].item_category,
        );
        console.log("Sample menu unit:", data.data[0].unit);
        console.log("Sample menu unit type:", typeof data.data[0].unit);
      }
      setMenus(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch menus");
    }
  };

  useEffect(() => {
    if (!isFetched.current) {
      const loadInitialData = async () => {
        const token = getCookie("adminToken");
        if (token) {
          await Promise.all([fetchUnits(), fetchCategories(), fetchMenus()]);
        }
      };

      loadInitialData();
      isFetched.current = true;
    }
  }, []);

  const extractIdFromString = (value) => {
    if (typeof value === "string" && value.includes("object")) {
      const match = value.match(/\((\d+)\)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const getCategoryName = (itemCategory) => {
    if (!itemCategory) return "N/A";

    if (typeof itemCategory === "object" && itemCategory !== null) {
      if (itemCategory.name) return itemCategory.name;

      if (itemCategory.item_category && itemCategory.item_category.name) {
        return itemCategory.item_category.name;
      }

      const lookupId = itemCategory.reference_id || itemCategory.id;
      if (lookupId) {
        const found = categoriesList.find(
          (c) =>
            c.reference_id === lookupId ||
            (c.id && String(c.id) === String(lookupId)),
        );
        if (found) return found.name;
      }
    }

    if (typeof itemCategory === "string" && itemCategory) {
      const found = categoriesList.find((c) => c.reference_id === itemCategory);
      if (found) return found.name;

      const extractedId = extractIdFromString(itemCategory);
      if (extractedId) {
        const foundById = categoriesList.find((c) => {
          if (c.id && String(c.id) === extractedId) return true;
          if (c.reference_id === extractedId) return true;
          return false;
        });
        if (foundById) return foundById.name;
      }
    }

    return "N/A";
  };

  const getUnitName = (unit) => {
    if (!unit) return "N/A";

    if (typeof unit === "object" && unit !== null) {
      if (unit.name) return unit.name;

      if (unit.unit && unit.unit.name) {
        return unit.unit.name;
      }

      const lookupId = unit.reference_id || unit.id;
      if (lookupId) {
        const found = units.find(
          (u) =>
            u.reference_id === lookupId ||
            (u.id && String(u.id) === String(lookupId)),
        );
        if (found) return found.name;
      }
    }

    if (typeof unit === "string" && unit) {
      const found = units.find((u) => u.reference_id === unit);
      if (found) return found.name;

      const extractedId = extractIdFromString(unit);
      if (extractedId) {
        const foundById = units.find((u) => {
          if (u.id && String(u.id) === extractedId) return true;
          if (u.reference_id === extractedId) return true;
          return false;
        });
        if (foundById) return foundById.name;
      }
    }

    return "N/A";
  };

  const handleCategoryChange = (index, field, value) => {
    const updated = [...form.categories];
    updated[index][field] = value;
    setForm({ ...form, categories: updated });
  };

  const handleCategoryImage = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("Image size must be less than 1MB");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }

    const updated = [...form.categories];
    updated[index].imageFile = file;
    updated[index].imagePreview = URL.createObjectURL(file);
    setForm({ ...form, categories: updated });
  };

  const handleAddCategory = () => {
    setForm({
      ...form,
      categories: [
        ...form.categories,
        { name: "", price: "", item_category: "", unit: "", imageFile: null },
      ],
    });
  };

  const handleDeleteCategoryForm = (index) => {
    const updated = form.categories.filter((_, i) => i !== index);
    setForm({ ...form, categories: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getCookie("adminToken");
      if (!token) throw new Error("Login again!");

      const formData = new FormData();

      if (editingMenuId) {
        const cat = form.categories[0];

        formData.append("menu_date", form.menu_date);
        formData.append("name", cat.name);
        formData.append("price", cat.price);
        formData.append("item_category", cat.item_category);
        formData.append("unit", cat.unit);

        if (cat.imageFile) {
          formData.append("image", cat.imageFile);
        }
      } else {
        formData.append("menu_date", form.menu_date);

        form.categories.forEach((cat, index) => {
          const categoryJSON = {
            name: cat.name,
            price: cat.price,
            item_category: cat.item_category,
            unit: cat.unit,
          };
          formData.append(`items[${index}][name]`, cat.name);
          formData.append(`items[${index}][price]`, cat.price);
          formData.append(`items[${index}][item_category]`, cat.item_category);
          formData.append(`items[${index}][unit]`, cat.unit);

          if (cat.imageFile) {
            formData.append(`items[${index}][image]`, cat.imageFile);
          }
        });
        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }

      const url = editingMenuId
        ? `${API_URL}/api/menus/${editingMenuId}/`
        : `${API_URL}/api/menus/`;

      const method = editingMenuId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok || resData.response_code !== "0") {
        throw new Error(resData.message || "Save failed");
      }

      toast.success(editingMenuId ? "Menu updated!" : "Menu created!");

      setForm({
        menu_date: "",
        categories: [
          { name: "", price: "", item_category: "", unit: "", imageFile: null },
        ],
      });

      setEditingMenuId(null);
      setShowForm(false);
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving menu");
    }

    setLoading(false);
  };

  const handleEditMenu = (menu) => {
    setEditingMenuId(menu.reference_id);

    setForm({
      menu_date: menu.menu_date || "",
      categories: [
        {
          name: menu.name || "",
          price: menu.price || "",
          item_category: menu.item_category,
          unit: menu.unit,
          imageFile: null,
          imagePreview: menu.image || menu.image_url || null,
        },
      ],
    });

    setShowForm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteMenu) return;

    try {
      const token = getCookie("adminToken");
      const res = await fetch(
        `${API_URL}/api/menus/${deleteMenu.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to delete menu");

      toast.success("Menu deleted!");
      fetchMenus();
    } catch (err) {
      toast.error(err.message || "Delete failed");
      console.error(err);
    } finally {
      setShowDeleteModal(false);
      setDeleteMenu(null);
    }
  };

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name?.toLowerCase().includes(search.toLowerCase()) ||
      getCategoryName(menu.item_category)
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(e);
    setShowForm(false);
  };
  return (
    <>
      <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2] ">
        <ToastProvider />

        <HeaderWithSearch
          title="Menu"
          searchValue={search}
          onSearchChange={setSearch}
          buttonLabel="Create"
          onButtonClick={() => {
            resetForm();
            setShowForm(true);
          }}
          placeholder="Search Menu..."
        />

        {showDeleteModal && (
          <DeleteModal
            branch={deleteMenu?.name}
            setShowDeleteModal={() => setShowDeleteModal(false)}
            handleDeleteConfirmed={handleDeleteConfirmed}
          />
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
            <div className="bg-white w-full max-w-4xl rounded shadow-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-gray-300">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-white">
                <h2 className="text-[14px] font-semibold text-gray-800 tracking-tight">
                  Menu Categorie
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-red-500 hover:text-red-600 transition-all p-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-[12px] text-gray-600 font-medium whitespace-nowrap">
                    Menu Date:
                  </label>
                  <input
                    type="date"
                    value={form.menu_date}
                    onChange={(e) =>
                      setForm({ ...form, menu_date: e.target.value })
                    }
                    className="w-40 border border-gray-300 px-2 py-1 rounded hover:border-blue-400 focus:border-blue-500 outline-none transition-all text-[12px]"
                    required
                  />
                </div>
                {/* Wrapper div ma height ra overflow thapiyeko cha */}
                <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white max-h-[400px] overflow-y-auto">
                  <table className="w-full border-collapse relative">
                    {/* HEADER - Sticky banauko lagi z-10 ra sticky top-0 halnu parcha */}
                    <thead className="bg-white border-b border-gray-300 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                      <tr className="text-[14px] text-gray-600 font-medium">
                        <th className="px-4 py-1 text-left border-r border-gray-300 w-56 bg-white sticky top-0">
                          Name
                        </th>
                        <th className="px-4 py-1 text-left border-r border-gray-300 w-24 bg-white sticky top-0">
                          Price
                        </th>
                        <th className="px-4 py-1 text-left border-r border-gray-300 w-45 bg-white sticky top-0">
                          Category
                        </th>
                        <th className="px-4 py-1 text-left border-r border-gray-300 w-35 bg-white sticky top-0">
                          Unit
                        </th>
                        <th className="px-4 py-1 text-center border-r border-gray-300 w-16 bg-white sticky top-0">
                          Img
                        </th>
                        <th className="px-4 py-1 text-center w-20 bg-white sticky top-0">
                          Action
                        </th>
                      </tr>
                    </thead>

                    {/* BODY */}
                    {/* BODY */}
                    <tbody>
                      {form.categories.map((cat, idx) => (
                        <tr key={idx} className="border-b border-gray-300">
                          {/* Name - Height matched to 30px */}
                          <td className="p-1.5 border-r border-gray-300">
                            <input
                              type="text"
                              value={cat.name}
                              placeholder="Enter menu name"
                              onChange={(e) =>
                                handleCategoryChange(
                                  idx,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-gray-300 rounded-md px-3 h-[30px] text-[14px] outline-none focus:border-blue-500"
                              required
                            />
                          </td>

                          {/* Price - Height matched to 30px */}
                          <td className="p-1.5 border-r border-gray-300">
                            <input
                              type="number"
                              value={cat.price}
                              placeholder="0.00"
                              onChange={(e) =>
                                handleCategoryChange(
                                  idx,
                                  "price",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-gray-300 rounded-md px-3 h-[30px] text-[14px] outline-none focus:border-blue-500"
                              required
                            />
                          </td>

                          {/* Category Select - style height already 30px cha */}
                          <td className="p-1.5 border-r border-gray-300">
                            <div className="relative">
                              <Select
                                showSearch
                                allowClear
                                open={openDropdownIdx === idx}
                                onDropdownVisibleChange={(visible) =>
                                  setOpenDropdownIdx(visible ? idx : null)
                                }
                                value={cat.item_category || undefined}
                                placeholder="Select"
                                className="w-full text-[14px] custom-card-select"
                                style={{ height: "30px" }}
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                  (option?.label ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                                onChange={(value) => {
                                  handleCategoryChange(
                                    idx,
                                    "item_category",
                                    value,
                                  );
                                  setOpenDropdownIdx(null);
                                }}
                                popupClassName="custom-dropdown-card"
                                options={categoriesList.map((c) => ({
                                  value: c.reference_id,
                                  label: c.name,
                                }))}
                              />
                            </div>
                          </td>

                          {/* Unit Select - style height already 30px cha */}
                          <td className="p-1.5 border-r border-gray-300">
                            <div className="relative">
                              <Select
                                showSearch
                                allowClear
                                open={openUnitDropdownIdx === idx}
                                onDropdownVisibleChange={(visible) =>
                                  setOpenUnitDropdownIdx(visible ? idx : null)
                                }
                                value={cat.unit || undefined}
                                placeholder="Unit"
                                className="w-full text-[14px] custom-card-select"
                                style={{ height: "30px" }}
                                optionFilterProp="label"
                                popupClassName="custom-dropdown-card"
                                onChange={(value) => {
                                  handleCategoryChange(idx, "unit", value);
                                  setOpenUnitDropdownIdx(null);
                                }}
                                filterOption={(input, option) =>
                                  (option?.label ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                                options={units.map((u) => ({
                                  value: u.reference_id,
                                  label: u.name,
                                }))}
                              />
                            </div>
                          </td>

                          {/* Image - Height matched to 30px */}
                          <td className="p-1.5 border-r border-gray-300 text-center">
                            <input
                              type="file"
                              id={`upload-${idx}`}
                              onChange={(e) => handleCategoryImage(idx, e)}
                              className="hidden"
                            />
                            <label
                              htmlFor={`upload-${idx}`}
                              className="inline-flex w-full h-[30px] items-center justify-center border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 bg-white"
                            >
                              {cat.imagePreview ? (
                                <img
                                  src={cat.imagePreview}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <Plus size={14} className="text-gray-400" />
                              )}
                            </label>
                          </td>

                          {/* Action - Vertically centered in 30px line */}
                          <td className="p-1.5 text-center">
                            <div className="flex justify-center items-center gap-4 h-[30px]">
                              {idx === form.categories.length - 1 && (
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="text-green-500 hover:text-green-600"
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategoryForm(idx)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  className={`px-4 py-1.5 text-[12px] font-semibold text-white rounded shadow-sm transition-all cursor-pointer
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#236B28] hover:bg-[#1C5721] active:scale-95"
              }`}
                >
                  {loading ? "Saving..." : editingMenuId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
              <thead className="sticky top-0 bg-[#fafafa] z-10">
                <tr>
                  {heading.map((header, i) => (
                    <th
                      key={header}
                      className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700 last:border-r-0 "
                      style={{
                        width:
                          header === "SN"
                            ? "40px"
                            : header === "Action"
                              ? "80px"
                              : "auto",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredMenus.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-8 text-gray-400 border-b border-gray-300"
                    >
                      {search ? "No menu matches your search" : "No menu found"}
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((menu, index) => (
                    <tr
                      key={menu.reference_id}
                      className="hover:bg-blue-50/30 transition-all"
                    >
                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        {index + 1}
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        {menu.menu_date}
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0 capitalize">
                        {menu.name}
                      </td>

                      <td className="border-b border-r border-gray-300 px-1 py-0.5 last:border-r-0">
                        {menu.price}
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        {getCategoryName(menu.item_category)}
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        {getUnitName(menu.unit)}
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        <div className="w-6 h-6 overflow-hidden mx-auto">
                          <MenuImageHover src={menu.image || menu.image_url} />
                        </div>
                      </td>

                      <td className="border-b border-gray-300 px-2 py-0.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditMenu(menu)}
                            className="text-blue-500 hover:scale-110 transition cursor-pointer"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteMenu(menu);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:scale-110 transition cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div> */}

        <CustomTable
          data={filteredMenus}
          columns={columns}
          emptyMessage="No menu found"
          searchQuery={search}
        />
      </div>
    </>
  );
}
