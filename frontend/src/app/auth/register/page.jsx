"use client";
import { useRouter } from "next/navigation";
import ToastProvider from "@/components/ToastProvider";
import {
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
  Eye,
  EyeOff,
  Building2,
  Landmark,
  ChevronDown,
  Check,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function AdminRegisterPage({
  adminData = null,
  admins = [],
  refreshAdmins,
  closeModal,
}) {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [adminToken, setAdminToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(false);

  const restaurantRef = useRef(null);
  const branchRef = useRef(null);

  const [validationErrors, setValidationErrors] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    address: "",
    password: "",
    restaurant: "",
    branch: "",
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    mobile_number: "",
    address: "",
    restaurant: "",
    branch: "",
  });

  useEffect(() => {
    const token = getCookie("adminToken");
    if (!token) {
      toast.error("Admin token not found. Please login first.");
      return;
    }
    setAdminToken(token);
    fetchRestaurants(token);
    fetchBranches(token);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideRestaurant =
        restaurantRef.current && !restaurantRef.current.contains(event.target);
      const isOutsideBranch =
        branchRef.current && !branchRef.current.contains(event.target);

      if (isOutsideRestaurant && isOutsideBranch) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRestaurants = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setRestaurants(data.data?.results || []);
    } catch (err) {
      toast.error("Failed to fetch restaurants.");
    }
  };

  const fetchBranches = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setBranches(data.data?.results || []);
    } catch (err) {
      toast.error("Failed to fetch branches.");
    }
  };

  useEffect(() => {
    if (form.restaurant) {
      const filtered = branches.filter(
        (b) => b.restaurant_reference_id === form.restaurant,
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches([]);
    }
    setForm((prev) => ({ ...prev, branch: "" }));

    if (validationErrors.branch) {
      setValidationErrors((prev) => ({ ...prev, branch: "" }));
    }
    if (validationErrors.restaurant && form.restaurant) {
      setValidationErrors((prev) => ({ ...prev, restaurant: "" }));
    }
  }, [form.restaurant, branches]);

  useEffect(() => {
    if (adminData) {
      setForm({
        username: adminData.username || "",
        password: "",
        first_name: adminData.first_name || "",
        last_name: adminData.last_name || "",
        email: adminData.email || "",
        mobile_number: adminData.mobile_number || "",
        address: adminData.address || "",
        restaurant: adminData.restaurant?.reference_id || "",
        branch: adminData.branch?.reference_id || "",
      });
    }
  }, [adminData]);

  const validateForm = () => {
    const errors = {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      mobile_number: "",
      address: "",
      password: "",
      restaurant: "",
      branch: "",
    };
    let hasError = false;

    if (!form.username || form.username.trim() === "") {
      errors.username = "Username is required";
      hasError = true;
    } else if (form.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
      hasError = true;
    } else if (form.username.length > 50) {
      errors.username = "Username must be less than 50 characters";
      hasError = true;
    } else {
      const duplicate = admins.some(
        (a) =>
          a.username?.toLowerCase() === form.username.trim().toLowerCase() &&
          a.reference_id !== adminData?.reference_id,
      );
      if (duplicate) {
        errors.username = "Username already exists";
        hasError = true;
      }
    }

    if (!form.first_name || form.first_name.trim() === "") {
      errors.first_name = "First name is required";
      hasError = true;
    } else if (form.first_name.length < 2) {
      errors.first_name = "First name must be at least 2 characters";
      hasError = true;
    }

    if (!form.last_name || form.last_name.trim() === "") {
      errors.last_name = "Last name is required";
      hasError = true;
    } else if (form.last_name.length < 2) {
      errors.last_name = "Last name must be at least 2 characters";
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || form.email.trim() === "") {
      errors.email = "Email is required";
      hasError = true;
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Please enter a valid email address";
      hasError = true;
    } else {
      const duplicate = admins.some(
        (a) =>
          a.email?.toLowerCase() === form.email.trim().toLowerCase() &&
          a.reference_id !== adminData?.reference_id,
      );
      if (duplicate) {
        errors.email = "Email already exists";
        hasError = true;
      }
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!form.mobile_number || form.mobile_number.trim() === "") {
      errors.mobile_number = "Mobile number is required";
      hasError = true;
    } else if (!phoneRegex.test(form.mobile_number)) {
      errors.mobile_number = "Please enter a valid 10-digit mobile number";
      hasError = true;
    } else {
      const duplicate = admins.some(
        (a) =>
          a.mobile_number === form.mobile_number.trim() &&
          a.reference_id !== adminData?.reference_id,
      );
      if (duplicate) {
        errors.mobile_number = "Mobile number already exists";
        hasError = true;
      }
    }

    if (!form.address || form.address.trim() === "") {
      errors.address = "Address is required";
      hasError = true;
    } else if (form.address.length < 5) {
      errors.address = "Address must be at least 5 characters";
      hasError = true;
    }

    if (!adminData?.reference_id) {
      if (!form.password || form.password.length < 3) {
        errors.password = "Password must be at least 3 characters";
        hasError = true;
      }
    } else if (
      form.password &&
      form.password.length > 0 &&
      form.password.length < 6
    ) {
      errors.password = "Password must be at least 6 characters";
      hasError = true;
    }

    if (!form.restaurant || form.restaurant === "") {
      errors.restaurant = "Please select a restaurant";
      hasError = true;
    }

    if (form.restaurant && (!form.branch || form.branch === "")) {
      errors.branch = "Please select a branch";
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

    if (!adminToken) {
      toast.error("Admin token missing!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        mobile_number: form.mobile_number.trim(),
        address: form.address.trim(),
        restaurant: form.restaurant,
        branch: form.branch,
      };

      if (form.password) {
        payload.password = form.password;
      }

      let res;
      if (adminData?.reference_id) {
        res = await fetch(
          `${API_URL}/api/user/admins/${adminData.reference_id}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${adminToken}`,
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetch(`${API_URL}/api/user/admins/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.response || "Failed to register");
        setLoading(false);
        return;
      }

      toast.success(
        adminData ? "Admin updated!" : "Admin registered successfully!",
      );

      if (refreshAdmins) refreshAdmins();
      if (closeModal) closeModal();
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (closeModal) {
      closeModal();
    } else {
      router.back();
    }
  };

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#236B28]/10 backdrop-blur-md">
        <ToastProvider />

        <div className="relative w-full max-w-[670px] bg-white rounded-lg shadow-sm overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <UserPlus className="text-[#1C4D21] w-5 h-5" />
              <h2 className="text-[16px] font-semibold text-gray-800">
                {adminData ? "Edit Admin Account" : "Admin Registration"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 text-red-500 hover:text-red-500 hover:bg-gray-50 p-1.5 rounded transition-all cursor-pointer"
            >
              <svg
                viewBox="64 64 896 896"
                width="1.2em"
                height="1.2em"
                fill="currentColor"
              >
                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
              </svg>
            </button>
          </div>

          <div className="px-6 py-5  h-[80vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[13px] text-gray-700 flex items-center gap-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) =>
                        handleFieldChange("username", e.target.value)
                      }
                      className={`w-full pl-9 pr-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all placeholder:text-gray-300 ${
                        validationErrors.username
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      autoFocus
                    />
                  </div>
                  {validationErrors.username && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {validationErrors.username}
                    </p>
                  )}
                </div>

                {adminData?.reference_id ? null : (
                  <div className="space-y-1">
                    <label className="text-[13px] text-gray-700 flex items-center gap-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]"
                        size={14}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) =>
                          handleFieldChange("password", e.target.value)
                        }
                        className={`w-full pl-9 pr-10 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all placeholder:text-gray-300 ${
                          validationErrors.password
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-[10px] mt-0.5">
                        {validationErrors.password}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!adminData?.reference_id ? (
                <div className="space-y-1">
                  <label className="text-[13px] text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]"
                      size={14}
                    />
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={form.email}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      className={`w-full pl-9 pr-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all ${
                        validationErrors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[13px] text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]"
                      size={14}
                    />
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={form.email}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      className={`w-full pl-9 pr-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all ${
                        validationErrors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[13px] text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) =>
                      handleFieldChange("first_name", e.target.value)
                    }
                    className={`w-full px-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all ${
                      validationErrors.first_name
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.first_name && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {validationErrors.first_name}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) =>
                      handleFieldChange("last_name", e.target.value)
                    }
                    className={`w-full px-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all ${
                      validationErrors.last_name
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.last_name && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {validationErrors.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[13px] text-gray-700">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]"
                      size={14}
                    />
                    <input
                      type="tel"
                      placeholder="98XXXXXXXX"
                      value={form.mobile_number}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleFieldChange("mobile_number", value);
                      }}
                      className={`w-full pl-9 pr-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all ${
                        validationErrors.mobile_number
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
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
                  <label className="text-[13px] text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="City, Street"
                      value={form.address || ""}
                      onChange={(e) =>
                        handleFieldChange("address", e.target.value)
                      }
                      className={`w-full pl-9 pr-3 py-1.5 text-[14px] border rounded focus:border-[#1C4D21] outline-none transition-all ${
                        validationErrors.address
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {validationErrors.address && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {validationErrors.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative" ref={restaurantRef}>
                  <label className="text-[13px] font-semibold text-gray-600 block ml-0.5">
                    Restaurant <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <div
                      onClick={() =>
                        setOpenDropdown(openDropdown === "res" ? null : "res")
                      }
                      className={`relative w-full flex items-center h-[38px] pl-9 pr-10 bg-white border rounded-[6px] cursor-pointer transition-all duration-200 ${
                        openDropdown === "res"
                          ? "border-[#236B28] ring-[3px] ring-[#236B28]/10 shadow-sm"
                          : validationErrors.restaurant
                            ? "border-red-500 bg-red-50"
                            : "border-[#d9d9d9] hover:border-[#236B28] shadow-sm"
                      }`}
                    >
                      <Building2
                        className={`absolute left-3 text-gray-400 ${openDropdown === "res" ? "text-[#236B28]" : ""}`}
                        size={14}
                      />
                      <span
                        className={`text-[13px] truncate ${!form.restaurant ? "text-gray-400" : "text-gray-700 font-medium"}`}
                      >
                        {restaurants.find(
                          (r) => r.reference_id === form.restaurant,
                        )?.name || "Select Restaurant"}
                      </span>
                      <div className="absolute right-3 border-l border-gray-100 pl-2 text-gray-400">
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${openDropdown === "res" ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {openDropdown === "res" && (
                      <div className="absolute top-full z-999 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 max-h-[220px] overflow-y-auto space-y-2 bg-white">
                          {restaurants.map((r) => (
                            <div
                              key={r.reference_id}
                              onClick={() => {
                                handleFieldChange("restaurant", r.reference_id);
                                setOpenDropdown(null);
                              }}
                              className={`group px-3 py-2.5 text-[13px] flex items-center justify-between rounded-lg cursor-pointer transition-all border ${
                                form.restaurant === r.reference_id
                                  ? "bg-[#eef5ee] border-[#236B28] text-[#236B28] font-bold shadow-sm"
                                  : "bg-[#f8f9fa] border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-[#f1f3f5]"
                              }`}
                            >
                              <span className="truncate">{r.name}</span>
                              {form.restaurant === r.reference_id && (
                                <div className="bg-[#236B28] rounded-full p-0.5">
                                  <Check
                                    size={10}
                                    className="text-white"
                                    strokeWidth={4}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {validationErrors.restaurant && (
                    <p className="text-red-500 text-[10px] mt-1">
                      {validationErrors.restaurant}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 relative" ref={branchRef}>
                  <label className="text-[13px] font-semibold text-gray-600 block ml-0.5">
                    Branch <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <div
                      onClick={() => {
                        if (!form.restaurant) {
                          toast.error("Please select a restaurant first");
                          return;
                        }
                        setOpenDropdown(openDropdown === "br" ? null : "br");
                      }}
                      className={`relative w-full flex items-center h-[38px] pl-9 pr-10 bg-white border rounded-[6px] cursor-pointer transition-all duration-200 ${
                        openDropdown === "br"
                          ? "border-[#236B28] ring-[3px] ring-[#236B28]/10 shadow-sm"
                          : validationErrors.branch
                            ? "border-red-500 bg-red-50"
                            : "border-[#d9d9d9] hover:border-[#236B28] shadow-sm"
                      } ${!form.restaurant ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Landmark
                        className={`absolute left-3 text-gray-400 ${openDropdown === "br" ? "text-[#236B28]" : ""}`}
                        size={14}
                      />
                      <span
                        className={`text-[13px] truncate ${!form.branch ? "text-gray-400" : "text-gray-700 font-medium"}`}
                      >
                        {filteredBranches.find(
                          (b) => b.reference_id === form.branch,
                        )?.name || "Select Branch"}
                      </span>
                      <div className="absolute right-3 border-l border-gray-100 pl-2 text-gray-400">
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${openDropdown === "br" ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {openDropdown === "br" && (
                      <div className="absolute top-full z-999 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 max-h-[220px] overflow-y-auto space-y-2 bg-white">
                          {filteredBranches.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-[12px] bg-[#f8f9fa] rounded-lg border border-dashed border-gray-200">
                              Please select a restaurant first
                            </div>
                          ) : (
                            filteredBranches.map((b) => (
                              <div
                                key={b.reference_id}
                                onClick={() => {
                                  handleFieldChange("branch", b.reference_id);
                                  setOpenDropdown(null);
                                }}
                                className={`group px-3 py-2.5 text-[13px] flex items-center justify-between rounded-lg cursor-pointer transition-all border ${
                                  form.branch === b.reference_id
                                    ? "bg-[#eef5ee] border-[#236B28] text-[#236B28] font-bold shadow-sm"
                                    : "bg-[#f8f9fa] border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-[#f1f3f5]"
                                }`}
                              >
                                <span className="truncate">{b.name}</span>
                                {form.branch === b.reference_id && (
                                  <div className="bg-[#236B28] rounded-full p-0.5">
                                    <Check
                                      size={10}
                                      className="text-white"
                                      strokeWidth={4}
                                    />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {validationErrors.branch && (
                    <p className="text-red-500 text-[10px] mt-1">
                      {validationErrors.branch}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-1.5 text-[14px] font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-1.5 text-white rounded text-[14px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#1C4D21] hover:bg-[#143918]"
                  }`}
                >
                  {loading
                    ? "Saving..."
                    : adminData
                      ? "Update Admin"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
