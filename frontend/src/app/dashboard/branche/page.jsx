"use client";
import { Select } from "antd";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import ToastProvider from "@/components/ToastProvider";
import "@/styles/customButtons.css";
import HeaderWithSearch from "@/components/HeaderWithSearch";
import DeleteModal from "@/components/DeleteModal";
import CustomTable from "@/components/CustomTable";
import CustomPagination from "@/components/CustomPagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

function RestaurantDropdown({ restaurants, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = restaurants.find((r) => r.reference_id === value);

  const rect = document
    .getElementById("restaurant-button")
    ?.getBoundingClientRect();

  return (
    <div className="relative">
      <button
        id="restaurant-button"
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-amber-300 p-1 rounded text-sm
        flex justify-between items-center
        focus:outline-none focus:ring-1 focus:ring-amber-300"
      >
        <span>{selected ? selected.name : "Select Restaurant"}</span>
        <span className="text-amber-500">▼</span>
      </button>

      {open &&
        createPortal(
          <ul
            className="absolute z-50 w-[300px] bg-white border border-amber-300 rounded shadow"
            style={{
              top: rect?.bottom + window.scrollY,
              left: rect?.left + window.scrollX,
            }}
          >
            {restaurants.map((r) => (
              <li
                key={r.reference_id}
                onClick={() => {
                  onChange({
                    target: { name: "restaurant_id", value: r.reference_id },
                  });
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm hover:bg-amber-100 cursor-pointer"
              >
                {r.name}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}

export default function BranchPage() {
  const [branches, setBranches] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteBranch, setDeleteBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile_number: "",
    restaurant_id: "",
    email: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    address: "",
    mobile_number: "",
    restaurant_id: "",
    email: "",
  });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const confirmDelete = (b) => {
    setDeleteBranch(b);
    setShowDeleteModal(true);
  };

  const fetchRestaurants = async () => {
    const token = getCookie("adminToken");

    const res = await fetch(`${API_URL}/api/restaurants/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const data = await res.json();

    const restaurantList = data.data?.results || [];

    setRestaurants(restaurantList);

    return restaurantList;
  };

  const fetchBranches = async (restaurantList) => {
    const token = getCookie("adminToken");

    const res = await fetch(`${API_URL}/api/branches/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const data = await res.json();

    setTotalCount(data?.data?.count);

    const mapped = (data.data?.results || []).map((b) => {
      const restaurant = restaurantList.find(
        (r) => r.reference_id === b.restaurant_reference_id,
      );

      return {
        ...b,
        restaurant_name: restaurant?.name || "-",
      };
    });

    setBranches(mapped);
  };

  useEffect(() => {
    const load = async () => {
      const restaurantList = await fetchRestaurants();
      await fetchBranches(restaurantList);
    };

    load();
  }, [page, rowsPerPage]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [branches, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
    setForm({
      name: "",
      address: "",
      mobile_number: "",
      restaurant_id: "",
      email: "",
    });
    setValidationErrors({
      name: "",
      address: "",
      mobile_number: "",
      restaurant_id: "",
      email: "",
    });
  };

  const validateForm = () => {
    const errors = {
      name: "",
      address: "",
      mobile_number: "",
      restaurant_id: "",
      email: "",
    };
    let hasError = false;

    if (!form.name || form.name.trim() === "") {
      errors.name = "Branch name is required";
      hasError = true;
    } else if (form.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
      hasError = true;
    } else if (form.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
      hasError = true;
    } else {
      const duplicate = branches.some(
        (b) =>
          b.name.toLowerCase() === form.name.trim().toLowerCase() &&
          b.reference_id !== editId,
      );
      if (duplicate) {
        errors.name = "Branch name already exists";
        hasError = true;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || form.email.trim() === "") {
      errors.email = "Email is required";
      hasError = true;
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Please enter a valid email address";
      hasError = true;
    } else {
      const duplicate = branches.some(
        (b) =>
          b.email.toLowerCase() === form.email.trim().toLowerCase() &&
          b.reference_id !== editId,
      );
      if (duplicate) {
        errors.email = "Email already exists";
        hasError = true;
      }
    }

    if (!form.address || form.address.trim() === "") {
      errors.address = "Address is required";
      hasError = true;
    } else if (form.address.length < 5) {
      errors.address = "Address must be at least 5 characters";
      hasError = true;
    } else if (form.address.length > 200) {
      errors.address = "Address must be less than 200 characters";
      hasError = true;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!form.mobile_number || form.mobile_number.trim() === "") {
      errors.mobile_number = "Mobile number is required";
      hasError = true;
    } else if (!phoneRegex.test(form.mobile_number)) {
      errors.mobile_number = "Please enter a valid 10-digit mobile number";
      hasError = true;
    } else {
      const duplicate = branches.some(
        (b) =>
          b.mobile_number === form.mobile_number.trim() &&
          b.reference_id !== editId,
      );
      if (duplicate) {
        errors.mobile_number = "Mobile number already exists";
        hasError = true;
      }
    }

    if (!form.restaurant_id || form.restaurant_id === "") {
      errors.restaurant_id = "Please select a restaurant";
      hasError = true;
    }

    setValidationErrors(errors);
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      const errorElement = document.querySelector(
        ".border-red-500, [status='error']",
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }
      return;
    }

    setLoading(true);

    try {
      const token = getCookie("adminToken");
      const url = editId
        ? `${API_URL}/api/branches/${editId}/`
        : `${API_URL}/api/branches/`;
      const method = editId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        mobile_number: form.mobile_number.trim(),
        restaurant_id: form.restaurant_id,
        email: form.email.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(editId ? "Updated!" : "Created!");
      closeModal();
      const restaurantList = await fetchRestaurants();
      await fetchBranches(restaurantList);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b) => {
    setEditId(b.reference_id);
    setForm({
      name: b.name,
      address: b.address,
      mobile_number: b.mobile_number,
      restaurant_id: b.restaurant_reference_id,
      email: b.email || "",
    });
    setValidationErrors({
      name: "",
      address: "",
      mobile_number: "",
      restaurant_id: "",
      email: "",
    });
    setShowForm(true);
  };

  const handleDeleteConfirmed = async (b) => {
    try {
      const token = getCookie("adminToken");
      const res = await fetch(`${API_URL}/api/branches/${b.reference_id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Deleted!");
      const restaurantList = await fetchRestaurants();
      await fetchBranches(restaurantList);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShowDeleteModal(false);
      setDeleteBranch(null);
    }
  };

  const branchColumns = [
    {
      header: "S.N.",
      width: "40px",
      render: (_, index) => (page - 1) * rowsPerPage + index + 1,
    },
    {
      header: "Name",
      render: (row) => row.name,
    },
    {
      header: "Email",
      render: (row) => row.email || "-",
    },
    {
      header: "Address",
      render: (row) => row.address,
    },
    {
      header: "Phone",
      render: (row) => row.mobile_number,
    },
    {
      header: "Restaurant",
      render: (row) => row.restaurant_name,
    },
    {
      header: "Action",
      width: "80px",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleEdit(row)}
            className=" text-blue-500 hover:scale-110 transition cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => confirmDelete(row)}
            className=" text-red-500 hover:scale-110 transition cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2] ">
        <ToastProvider />

        <HeaderWithSearch
          title="Branch"
          searchValue={search}
          onSearchChange={setSearch}
          onButtonClick={() => {
            closeModal();
            setShowForm(true);
          }}
          buttonLabel="Create"
          placeholder="Search Branch..."
        />

        {showDeleteModal && (
          <DeleteModal
            branch={deleteBranch?.name}
            setShowDeleteModal={() => {
              setShowDeleteModal(false);
            }}
            handleDeleteConfirmed={() => {
              handleDeleteConfirmed(deleteBranch);
            }}
          />
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
            <div className="bg-white w-full max-w-[440px] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <h2 className="text-[14px] font-bold text-[#236B28] tracking-tight">
                  {editId ? "Edit Branch" : "Add New Branch"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-red-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-4 bg-[#ddf4e2]/20">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 gap-3 bg-white p-4 rounded-md border border-gray-300 shadow-sm">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        Branch Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter branch name"
                        className={`w-full border px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-2 focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400 ${
                          validationErrors.name
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                        autoFocus
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-[10px] mt-0.5">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        className={`w-full border px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-2 focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400 ${
                          validationErrors.email
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-[10px] mt-0.5">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Location details"
                        className={`w-full border px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-2 focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400 ${
                          validationErrors.address
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {validationErrors.address && (
                        <p className="text-red-500 text-[10px] mt-0.5">
                          {validationErrors.address}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="mobile_number"
                        value={form.mobile_number}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value) && value.length <= 10) {
                            handleChange(e);
                          }
                        }}
                        placeholder="98XXXXXXXX"
                        className={`w-full border px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-2 focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400 ${
                          validationErrors.mobile_number
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {validationErrors.mobile_number && (
                        <p className="text-red-500 text-[10px] mt-0.5">
                          {validationErrors.mobile_number}
                        </p>
                      )}
                      {form.mobile_number && form.mobile_number.length > 0 && (
                        <p
                          className={`text-[10px] mt-0.5 ${
                            form.mobile_number.length === 10
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        >
                          {form.mobile_number.length}/10 digits
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        Select Restaurant{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <div className="relative group">
                        <Select
                          showSearch
                          placeholder="Please select a restaurant"
                          optionFilterProp="children"
                          name="restaurant_id"
                          value={form.restaurant_id || undefined}
                          onChange={(value) => {
                            setForm({ ...form, restaurant_id: value });
                            if (validationErrors.restaurant_id) {
                              setValidationErrors({
                                ...validationErrors,
                                restaurant_id: "",
                              });
                            }
                          }}
                          listHeight={220}
                          dropdownStyle={{
                            borderRadius: "12px",
                            padding: "8px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #e5e7eb",
                          }}
                          style={{
                            width: "100%",
                            height: "38px",
                          }}
                          status={validationErrors.restaurant_id ? "error" : ""}
                          styles={{
                            selector: {
                              borderRadius: "6px",
                              borderColor: validationErrors.restaurant_id
                                ? "#ef4444"
                                : "#d9d9d9",
                              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                              transition: "all 0.2s",
                            },
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#236B28";
                            e.currentTarget.style.boxShadow =
                              "0 0 0 3px rgba(35, 107, 40, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              validationErrors.restaurant_id
                                ? "#ef4444"
                                : "#d9d9d9";
                            e.currentTarget.style.boxShadow =
                              "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                          }}
                        >
                          {restaurants.map((res) => (
                            <Select.Option
                              key={res.reference_id}
                              value={res.reference_id}
                              style={{
                                borderRadius: "8px",
                                marginBottom: "4px",
                                fontSize: "13px",
                                backgroundColor:
                                  form.restaurant_id === res.reference_id
                                    ? "#eef5ee"
                                    : "transparent",
                                color:
                                  form.restaurant_id === res.reference_id
                                    ? "#236B28"
                                    : "#4b5563",
                                fontWeight:
                                  form.restaurant_id === res.reference_id
                                    ? "700"
                                    : "400",
                              }}
                            >
                              {res.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                      {validationErrors.restaurant_id && (
                        <p className="text-red-500 text-[10px] mt-0.5">
                          {validationErrors.restaurant_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-1.5 bg-[#236B28] text-white rounded text-[12px] font-semibold shadow-sm transition-all hover:bg-[#1C5721] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Saving..." : editId ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <CustomTable
          data={filteredBranches}
          columns={branchColumns}
          emptyMessage="No branch found"
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
