"use client";

import { Select } from "antd";

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

import CustomTable from "./CustomTable";

import CustomPagination from "./CustomPagination";

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

  const [validationErrors, setValidationErrors] = useState({
    menu_date: "",

    categories: [],
  });

  const [page, setPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [totalCount, setTotalCount] = useState(0);

  const columns = [
    {
      header: "S.N.",

      width: "40px",

      render: (_, index) => (page - 1) * rowsPerPage + index + 1,
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

    setValidationErrors({
      menu_date: "",

      categories: [{}],
    });

    setEditingMenuId(null);
  };

  const fetchUnits = async () => {
    try {
      const token = getCookie("adminToken");

      if (!token) return;

      const res = await fetch(
        `${API_URL}/api/units/?page=${page}&page_size=${rowsPerPage}`,

        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      const data = await res.json();

      setUnits(data.data?.results || []);
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

  useEffect(() => {
    fetchMenus();
  }, [page, rowsPerPage]);

  const fetchMenus = async () => {
    try {
      const token = getCookie("adminToken");

      if (!token) return;

      const res = await fetch(
        `${API_URL}/api/menus/?page=${page}&page_size=${rowsPerPage}`,

        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      const data = await res.json();

      setMenus(data.data?.results || []);

      setTotalCount(data?.data?.count || 0);
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

    if (validationErrors.categories[index]) {
      const updatedErrors = { ...validationErrors };

      if (field === "item_category" && (!value || value.trim() === "")) {
        updatedErrors.categories[index].item_category = "Category is required";
      } else if (field === "unit" && (!value || value.trim() === "")) {
        updatedErrors.categories[index].unit = "Unit is required";
      } else if (field === "name" && (!value || value.trim() === "")) {
        updatedErrors.categories[index].name = "Name is required";
      } else if (
        field === "price" &&
        (value === "" || value === null || value === undefined)
      ) {
        updatedErrors.categories[index].price = "Price is required";
      } else if (field === "price" && value !== "" && isNaN(value)) {
        updatedErrors.categories[index].price = "Price must be a number";
      } else if (field === "price" && value !== "" && Number(value) <= 0) {
        updatedErrors.categories[index].price = "Price must be greater than 0";
      } else {
        updatedErrors.categories[index][field] = "";
      }

      setValidationErrors(updatedErrors);
    }
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

    if (validationErrors.categories[index]?.image) {
      const updatedErrors = { ...validationErrors };

      if (updatedErrors.categories[index]) {
        updatedErrors.categories[index].image = "";
      }

      setValidationErrors(updatedErrors);
    }
  };

  const handleAddCategory = () => {
    setForm({
      ...form,

      categories: [
        ...form.categories,

        { name: "", price: "", item_category: "", unit: "", imageFile: null },
      ],
    });

    setValidationErrors({
      ...validationErrors,

      categories: [
        ...validationErrors.categories,

        { name: "", price: "", item_category: "", unit: "", image: "" },
      ],
    });
  };

  const handleDeleteCategoryForm = (index) => {
    const updated = form.categories.filter((_, i) => i !== index);

    setForm({ ...form, categories: updated });

    const updatedErrors = { ...validationErrors };

    updatedErrors.categories = updatedErrors.categories.filter(
      (_, i) => i !== index,
    );

    setValidationErrors(updatedErrors);
  };

  const validateForm = () => {
    const fieldErrors = {
      menu_date: "",
      categories: [],
    };

    let hasError = false;

    if (!form.menu_date) {
      fieldErrors.menu_date = "Menu date is required";
      hasError = true;
    }

    form.categories.forEach((cat, index) => {
      const categoryErrors = {};

      if (!cat.name || cat.name.trim() === "") {
        categoryErrors.name = "Name is required";
        hasError = true;
      }

      if (cat.price === "" || cat.price === null || cat.price === undefined) {
        categoryErrors.price = "Price is required";
        hasError = true;
      } else if (isNaN(cat.price)) {
        categoryErrors.price = "Price must be a number";
        hasError = true;
      } else if (Number(cat.price) <= 0) {
        categoryErrors.price = "Price must be greater than 0";
        hasError = true;
      }

      if (!cat.item_category || cat.item_category.trim() === "") {
        categoryErrors.item_category = "Category is required";
        hasError = true;
      }

      if (!cat.unit || cat.unit.trim() === "") {
        categoryErrors.unit = "Unit is required";
        hasError = true;
      }

      if (!editingMenuId && !cat.imageFile) {
        categoryErrors.image = "Image is required";
        hasError = true;
      }

      fieldErrors.categories.push(categoryErrors);
    });

    setValidationErrors(fieldErrors);
    return hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasError = validateForm();

    if (hasError) {
      const firstErrorElement = document.querySelector(
        ".border-red-500, [status='error']",
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        firstErrorElement.focus();
      }
      return;
    }

    setLoading(true);

    try {
      const token = getCookie("adminToken");

      if (!token) throw new Error("Login again!");

      const payload = new FormData();

      payload.append("menu_date", form.menu_date);

      if (editingMenuId) {
        const cat = form.categories[0];

        payload.append("name", cat.name);

        payload.append("price", cat.price);

        payload.append("item_category", cat.item_category);

        payload.append("unit", cat.unit);

        if (cat.imageFile) {
          payload.append("image", cat.imageFile);
        }
      } else {
        form.categories.forEach((cat, index) => {
          payload.append(`items[${index}][name]`, cat.name);

          payload.append(`items[${index}][price]`, cat.price);

          payload.append(`items[${index}][item_category]`, cat.item_category);

          payload.append(`items[${index}][unit]`, cat.unit);

          if (cat.imageFile) {
            payload.append(`items[${index}][image]`, cat.imageFile);
          }
        });
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

        body: payload,
      });

      let resData;

      try {
        resData = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok || resData.response_code !== "0") {
        throw new Error(resData.message || "Save failed");
      }

      toast.success(editingMenuId ? "Menu updated!" : "Menu created!");

      setForm({
        menu_date: "",

        categories: [
          {
            name: "",

            price: "",

            item_category: "",

            unit: "",

            imageFile: null,
          },
        ],
      });

      setValidationErrors({
        menu_date: "",

        categories: [{}],
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

  // Handle Edit

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

    setValidationErrors({
      menu_date: "",

      categories: [{}],
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

  const filteredMenus = Array.isArray(menus)
    ? menus.filter(
        (menu) =>
          menu.name?.toLowerCase().includes(search.toLowerCase()) ||
          getCategoryName(menu.item_category)
            ?.toLowerCase()

            .includes(search.toLowerCase()),
      )
    : [];

  return (
    <>
      <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2]">
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
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="bg-white w-full max-w-4xl rounded shadow-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-gray-300"
              noValidate
            >
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-white">
                <h2 className="text-[14px] font-semibold text-gray-800 tracking-tight">
                  {editingMenuId ? "Edit Menu" : "Create New Menu"}
                </h2>

                <button
                  type="button"
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
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>

                  <div className="flex-1">
                    <input
                      type="date"
                      value={form.menu_date}
                      onChange={(e) => {
                        setForm({ ...form, menu_date: e.target.value });

                        if (validationErrors.menu_date) {
                          setValidationErrors({
                            ...validationErrors,

                            menu_date: "",
                          });
                        }
                      }}
                      className={`w-40 border px-2 py-1 rounded hover:border-blue-400 focus:border-blue-500 outline-none transition-all text-[12px] ${
                        validationErrors.menu_date
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                      autoFocus
                    />

                    {validationErrors.menu_date && (
                      <p className="text-red-500 text-[10px] mt-0.5">
                        {validationErrors.menu_date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white max-h-[400px] overflow-y-auto">
                  <table className="w-full border-collapse relative">
                    <thead className="bg-white border-b border-gray-300 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                      <tr className="text-[14px] text-gray-600 font-medium">
                        <th className="px-4 py-1 text-left border-r border-gray-300 w-56 bg-white sticky top-0">
                          Name <span className="text-red-500">*</span>
                        </th>

                        <th className="px-4 py-1 text-left border-r border-gray-300 w-24 bg-white sticky top-0">
                          Price <span className="text-red-500">*</span>
                        </th>

                        <th className="px-4 py-1 text-left border-r border-gray-300 w-45 bg-white sticky top-0">
                          Category <span className="text-red-500">*</span>
                        </th>

                        <th className="px-4 py-1 text-left border-r border-gray-300 w-35 bg-white sticky top-0">
                          Unit <span className="text-red-500">*</span>
                        </th>

                        <th className="px-4 py-1 text-center border-r border-gray-300 w-16 bg-white sticky top-0">
                          Img <span className="text-red-500">*</span>
                        </th>

                        <th className="px-4 py-1 text-center w-20 bg-white sticky top-0">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {form.categories.map((cat, idx) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="p-1.5 border-r border-gray-300">
                            <div>
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
                                className={`w-full border rounded-md px-3 h-[30px] text-[14px] outline-none focus:border-blue-500 ${
                                  validationErrors.categories[idx]?.name
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                required
                              />

                              {validationErrors.categories[idx]?.name && (
                                <p className="text-red-500 text-[10px] mt-0.5">
                                  {validationErrors.categories[idx].name}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-1.5 border-r border-gray-300">
                            <div>
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
                                className={`w-full border rounded-md px-3 h-[30px] text-[14px] outline-none focus:border-blue-500 ${
                                  validationErrors.categories[idx]?.price
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                required
                                min="0.01"
                                step="0.01"
                              />

                              {validationErrors.categories[idx]?.price && (
                                <p className="text-red-500 text-[10px] mt-0.5">
                                  {validationErrors.categories[idx].price}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-1.5 border-r border-gray-300">
                            <div>
                              <div className="relative">
                                <Select
                                  showSearch
                                  allowClear
                                  open={openDropdownIdx === idx}
                                  onDropdownVisibleChange={(visible) =>
                                    setOpenDropdownIdx(visible ? idx : null)
                                  }
                                  value={cat.item_category || undefined}
                                  placeholder="Select category"
                                  className={`w-full text-[14px] custom-card-select ${
                                    validationErrors.categories[idx]
                                      ?.item_category
                                      ? "border-red-500"
                                      : ""
                                  }`}
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
                                  onClear={() => {
                                    handleCategoryChange(
                                      idx,

                                      "item_category",

                                      "",
                                    );

                                    const updatedErrors = {
                                      ...validationErrors,
                                    };

                                    if (updatedErrors.categories[idx]) {
                                      updatedErrors.categories[
                                        idx
                                      ].item_category = "Category is required";
                                    }

                                    setValidationErrors(updatedErrors);
                                  }}
                                  popupClassName="custom-dropdown-card"
                                  options={categoriesList.map((c) => ({
                                    value: c.reference_id,

                                    label: c.name,
                                  }))}
                                  status={
                                    validationErrors.categories[idx]
                                      ?.item_category
                                      ? "error"
                                      : ""
                                  }
                                />
                              </div>

                              {validationErrors.categories[idx]
                                ?.item_category && (
                                <p className="text-red-500 text-[10px] mt-0.5 text-left">
                                  {
                                    validationErrors.categories[idx]
                                      .item_category
                                  }
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-1.5 border-r border-gray-300">
                            <div>
                              <div className="relative">
                                <Select
                                  showSearch
                                  allowClear
                                  open={openUnitDropdownIdx === idx}
                                  onDropdownVisibleChange={(visible) =>
                                    setOpenUnitDropdownIdx(visible ? idx : null)
                                  }
                                  value={cat.unit || undefined}
                                  placeholder="Select unit"
                                  className={`w-full text-[14px] custom-card-select ${
                                    validationErrors.categories[idx]?.unit
                                      ? "border-red-500"
                                      : ""
                                  }`}
                                  style={{ height: "30px" }}
                                  optionFilterProp="label"
                                  popupClassName="custom-dropdown-card"
                                  onChange={(value) => {
                                    handleCategoryChange(idx, "unit", value);

                                    setOpenUnitDropdownIdx(null);
                                  }}
                                  onClear={() => {
                                    handleCategoryChange(idx, "unit", "");

                                    const updatedErrors = {
                                      ...validationErrors,
                                    };

                                    if (updatedErrors.categories[idx]) {
                                      updatedErrors.categories[idx].unit =
                                        "Unit is required";
                                    }

                                    setValidationErrors(updatedErrors);
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
                                  status={
                                    validationErrors.categories[idx]?.unit
                                      ? "error"
                                      : ""
                                  }
                                />
                              </div>

                              {validationErrors.categories[idx]?.unit && (
                                <p className="text-red-500 text-[10px] mt-0.5 text-left">
                                  {validationErrors.categories[idx].unit}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-1.5 border-r border-gray-300 text-center">
                            <div>
                              <input
                                type="file"
                                id={`upload-${idx}`}
                                onChange={(e) => handleCategoryImage(idx, e)}
                                className="hidden"
                                accept="image/*"
                                required={!editingMenuId && !cat.imageFile}
                              />

                              <label
                                htmlFor={`upload-${idx}`}
                                className={`inline-flex w-full h-[30px] items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:border-gray-400 bg-white ${
                                  validationErrors.categories[idx]?.image
                                    ? "border-red-500"
                                    : !cat.imageFile && !editingMenuId
                                      ? "border-red-300 hover:border-red-400"
                                      : "border-gray-300"
                                }`}
                              >
                                {cat.imagePreview ? (
                                  <img
                                    src={cat.imagePreview}
                                    className="w-full h-full object-cover rounded-md"
                                    alt="Menu item"
                                  />
                                ) : (
                                  <Plus size={14} className="text-gray-400" />
                                )}
                              </label>

                              {validationErrors.categories[idx]?.image && (
                                <p className="text-red-500 text-[10px] mt-0.5">
                                  {validationErrors.categories[idx].image}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-1.5 text-center">
                            <div className="flex justify-center items-center gap-4 h-[30px]">
                              {idx === form.categories.length - 1 && (
                                <button
                                  type="button"
                                  onClick={handleAddCategory}
                                  className="text-green-500 hover:text-green-600 transition-colors"
                                  title="Add new item"
                                >
                                  <Plus size={16} />
                                </button>
                              )}

                              {form.categories.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategoryForm(idx)}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                  title="Remove item"
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
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
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
            </form>
          </div>
        )}

        <CustomTable
          data={filteredMenus}
          columns={columns}
          emptyMessage="No menu found"
          searchQuery={search}
        />

        <CustomPagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalCount={totalCount}
        />
      </div>
    </>
  );
}
