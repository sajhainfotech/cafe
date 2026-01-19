"use client";
import { useRouter } from 'next/navigation';
import ToastProvider from "@/components/ToastProvider";
import { Lock, Mail, MapPin, Phone, User, UserPlus, Eye, EyeOff, Building2, Landmark, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
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
  refreshAdmins,
  closeModal,
    
  
}) {
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [adminToken, setAdminToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
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

  const fetchRestaurants = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setRestaurants(data.data || []);
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
      setBranches(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch branches.");
    }
  };

  useEffect(() => {
    if (form.restaurant) {
      const filtered = branches.filter(
        (b) => b.restaurant_reference_id === form.restaurant
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches([]);
    }
    setForm((prev) => ({ ...prev, branch: "" }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminToken) return toast.error("Admin token missing!");

    try {
      let res;
      if (adminData?.reference_id) {
        res = await fetch(`${API_URL}/api/user/admins/${adminData.reference_id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${adminToken}`,
          },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API_URL}/api/user/admins/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${adminToken}`,
          },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();
      if (!res.ok) return toast.error(data.response || "Failed to register");

      toast.success(adminData ? "Admin updated!" : "Admin registered successfully!");

      if (refreshAdmins) refreshAdmins();

      if (closeModal) closeModal();

    } catch (err) {
      toast.error("Something went wrong!");
    }
  };


  const router = useRouter();

  const handleClose = () => {
    if (closeModal) {
      closeModal(); 
    } else {
      router.back(); 
    }
  };



  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#236B28]/10 backdrop-blur-md">
      <ToastProvider />

      <div className="relative w-full max-w-[670px] bg-white rounded-lg shadow-sm overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
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
            className="absolute top-4 right-4 z-10 text-red-500 hover:text-red-500 hover:bg-gray-50 p-1.5 rounded transition-all"
          >
            <svg viewBox="64 64 896 896" width="1.2em" height="1.2em" fill="currentColor">
              <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[13px] text-gray-700 flex items-center gap-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]" size={14} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] text-gray-700 flex items-center gap-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!adminData}
                    className="w-full pl-9 pr-10 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none transition-all placeholder:text-gray-300"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

              <div className="space-y-1">
              <label className="text-[13px] text-gray-700">Email Address <span className="text-red-500">*</span></label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]" size={14} />
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[13px] text-gray-700">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="First name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] text-gray-700">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none"
                />
              </div>
            </div>

          

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[13px] text-gray-700">Mobile <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]" size={14} />
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={form.mobile_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, mobile_number: value });
                    }}
                    required
                    className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[13px] text-gray-700">Address <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21]" size={14} />
                  <input
                    type="text"
                    placeholder="City, Street"
                    value={form.address || ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-gray-300 rounded focus:border-[#1C4D21] outline-none"
                  />
                </div>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 relative" onMouseLeave={() => setOpenDropdown(null)}>
                <label className="text-[13px] font-semibold text-gray-600 block ml-0.5">
                  Restaurant <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'res' ? null : 'res')}
                    className={`relative w-full flex items-center h-[38px] pl-9 pr-10 bg-white border rounded-[6px] cursor-pointer transition-all duration-200
                  ${openDropdown === 'res' ? 'border-[#236B28] ring-[3px] ring-[#236B28]/10 shadow-sm' : 'border-[#d9d9d9] hover:border-[#236B28] shadow-sm'}
                 `}
                  >
                    <Building2 className={`absolute left-3 text-gray-400 ${openDropdown === 'res' ? 'text-[#236B28]' : ''}`} size={14} />
                    <span className={`text-[13px] truncate ${!form.restaurant ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                      {restaurants.find(r => r.reference_id === form.restaurant)?.name || "Select Restaurant"}
                    </span>
                    <div className="absolute right-3 border-l border-gray-100 pl-2 text-gray-400">
                      <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'res' ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {openDropdown === 'res' && (
                    <div className="absolute bottom-full z-[100] w-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom">
                      <div className="bg-[#f1f3f5] px-4 py-2.5 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Select Restaurant</span>
                      </div>

                      <div className="p-2 max-h-[220px] overflow-y-auto space-y-2 bg-white">
                        {restaurants.map((r) => (
                          <div
                            key={r.reference_id}
                            onClick={() => {
                              setForm({ ...form, restaurant: r.reference_id });
                              setOpenDropdown(null);
                            }}
                            className={`group px-3 py-2.5 text-[13px] flex items-center justify-between rounded-lg cursor-pointer transition-all border
                  ${form.restaurant === r.reference_id
                                ? 'bg-[#eef5ee] border-[#236B28] text-[#236B28] font-bold shadow-sm'
                                : 'bg-[#f8f9fa] border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-[#f1f3f5]'}
                `}
                          >
                            <span className="truncate">{r.name}</span>
                            {form.restaurant === r.reference_id && (
                              <div className="bg-[#236B28] rounded-full p-0.5">
                                <Check size={10} className="text-white" strokeWidth={4} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
              </div>

              <div className="space-y-1.5 relative" onMouseLeave={() => setOpenDropdown(null)}>
                <label className="text-[13px] font-semibold text-gray-600 block ml-0.5">
                  Branch <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'br' ? null : 'br')}
                    className={`relative w-full flex items-center h-[38px] pl-9 pr-10 bg-white border rounded-[6px] cursor-pointer transition-all duration-200
          ${openDropdown === 'br' ? 'border-[#236B28] ring-[3px] ring-[#236B28]/10 shadow-sm' : 'border-[#d9d9d9] hover:border-[#236B28] shadow-sm'}
        `}
                  >
                    <Landmark className={`absolute left-3 text-gray-400 ${openDropdown === 'br' ? 'text-[#236B28]' : ''}`} size={14} />
                    <span className={`text-[13px] truncate ${!form.branch ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                      {filteredBranches.find(b => b.reference_id === form.branch)?.name || "Select Branch"}
                    </span>
                    <div className="absolute right-3 border-l border-gray-100 pl-2 text-gray-400">
                      <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'br' ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {openDropdown === 'br' && (
                    <div className="absolute bottom-full z-[100] w-full mb-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom">
                      <div className="bg-[#f1f3f5] px-4 py-2.5 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Select Branch</span>
                      </div>

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
                                setForm({ ...form, branch: b.reference_id });
                                setOpenDropdown(null);
                              }}
                              className={`group px-3 py-2.5 text-[13px] flex items-center justify-between rounded-lg cursor-pointer transition-all border
                                ${form.branch === b.reference_id
                                  ? 'bg-[#eef5ee] border-[#236B28] text-[#236B28] font-bold shadow-sm'
                                  : 'bg-[#f8f9fa] border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-[#f1f3f5]'}
                                 `}
                            >
                              <span className="truncate">{b.name}</span>
                              {form.branch === b.reference_id && (
                                <div className="bg-[#236B28] rounded-full p-0.5">
                                  <Check size={10} className="text-white" strokeWidth={4} />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            <div className="pt-4 flex items-center justify-end gap-3">

              <button
                type="submit"
                className="px-6 py-1.5 bg-[#1C4D21] text-white rounded text-[14px] font-semibold hover:bg-[#143918] transition-all shadow-sm active:scale-95"
              >
                {adminData ? "Update Admin" : "Create"}
              </button>
            </div>

            
          </form>
        </div>
      </div>
    </div>
    </>
  );
}