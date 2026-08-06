"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";
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

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteRestaurant, setDeleteRestaurant] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile_number: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    address: "",
    mobile_number: "",
  });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRestaurants = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;

      const res = await fetch(
        `${API_URL}/api/restaurants/?page=${page}&page_size=${rowsPerPage}`,
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      const data = await res.json();
      setRestaurants(data.data?.results || []);
      setTotalCount(data?.data?.count);
    } catch (error) {
      toast.error("Failed to fetch restaurants");
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [page, rowsPerPage]);

  const filteredRestaurants = useMemo(() => {
    if (!Array.isArray(restaurants)) return [];

    return restaurants.filter((r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [restaurants, search]);

  const validateForm = () => {
    const errors = {
      name: "",
      address: "",
      mobile_number: "",
    };
    let hasError = false;

    if (!form.name || form.name.trim() === "") {
      errors.name = "Restaurant name is required";
      hasError = true;
    } else if (form.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
      hasError = true;
    } else if (form.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
      hasError = true;
    } else {
      const duplicate = restaurants.some(
        (r) =>
          r.name.toLowerCase() === form.name.trim().toLowerCase() &&
          r.reference_id !== editId,
      );
      if (duplicate) {
        errors.name = "Restaurant name already exists";
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
      const duplicate = restaurants.some(
        (r) =>
          r.mobile_number === form.mobile_number.trim() &&
          r.reference_id !== editId,
      );
      if (duplicate) {
        errors.mobile_number = "Mobile number already exists";
        hasError = true;
      }
    }

    setValidationErrors(errors);
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      const errorElement = document.querySelector(".border-red-500");
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
        ? `${API_URL}/api/restaurants/${editId}/`
        : `${API_URL}/api/restaurants/`;
      const method = editId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        mobile_number: form.mobile_number.trim(),
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
      fetchRestaurants();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (r) => {
    setEditId(r.reference_id);
    setForm({
      name: r.name,
      address: r.address,
      mobile_number: r.mobile_number,
    });
    setValidationErrors({
      name: "",
      address: "",
      mobile_number: "",
    });
    setShowForm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const token = getCookie("adminToken");
      const res = await fetch(
        `${API_URL}/api/restaurants/${deleteRestaurant.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        },
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Deleted!");
      fetchRestaurants();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShowDeleteModal(false);
      setDeleteRestaurant(null);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", address: "", mobile_number: "" });
    setValidationErrors({
      name: "",
      address: "",
      mobile_number: "",
    });
  };

  const restaurentColumns = [
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
      header: "Address",
      render: (row) => row.address,
    },
    {
      header: "Phone",
      render: (row) => row.mobile_number,
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
            onClick={() => {
              setDeleteRestaurant(row);
              setShowDeleteModal(true);
            }}
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
          title="Restaurant"
          searchValue={search}
          onSearchChange={setSearch}
          onButtonClick={() => {
            closeModal();
            setShowForm(true);
          }}
          placeholder="Search Restaurant..."
          buttonLabel="Create"
        />

        {showDeleteModal && (
          <DeleteModal
            branch={deleteRestaurant?.name}
            setShowDeleteModal={() => {
              setShowDeleteModal(false);
            }}
            handleDeleteConfirmed={handleDeleteConfirmed}
          />
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
            <div className="bg-white w-full max-w-[480px] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 bg-white">
                <h2 className="text-[14px] font-bold text-[#236B28] tracking-tight">
                  {editId ? "Edit Restaurant" : "Add New Restaurant"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-red-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-4 bg-[#ddf4e2]/20">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-md border border-gray-300 shadow-sm">
                    <div className="space-y-1">
                      <label className="block text-[12px] font-semibold text-gray-600">
                        Restaurant Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          if (validationErrors.name) {
                            setValidationErrors({
                              ...validationErrors,
                              name: "",
                            });
                          }
                        }}
                        placeholder="Enter restaurant name"
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
                      <label className="block text-[12px] font-semibold text-gray-600">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.address}
                        onChange={(e) => {
                          setForm({ ...form, address: e.target.value });
                          if (validationErrors.address) {
                            setValidationErrors({
                              ...validationErrors,
                              address: "",
                            });
                          }
                        }}
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
                      <label className="block text-[12px] font-semibold text-gray-600">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.mobile_number}
                        maxLength={10}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, mobile_number: value });
                          if (validationErrors.mobile_number) {
                            setValidationErrors({
                              ...validationErrors,
                              mobile_number: "",
                            });
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
                      className={`px-6 py-1.5 bg-[#236B28] text-white rounded text-[12px] font-semibold shadow-sm transition-all hover:bg-[#1C5721] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
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
          data={filteredRestaurants}
          columns={restaurentColumns}
          emptyMessage="No restaurant found"
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
