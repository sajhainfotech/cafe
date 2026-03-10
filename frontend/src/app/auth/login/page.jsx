"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";

const AdminLoginPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const setCookie = (name, value, days = 1) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();
    document.cookie =
      name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
  };

  useEffect(() => {
    const token = getCookie("adminToken");

    if (token) {
      router.replace("/dashboard");
      return;
    }

    localStorage.clear();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const authHeader = "Basic " + btoa(`${username}:${password}`);

      const res = await fetch(`${API_URL}/api/user/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || "Invalid credentials!");
        setLoading(false);
        return;
      }

      if (!data?.is_staff) {
        toast.error("Access Denied!");
        setLoading(false);
        return;
      }

      setCookie("adminToken", data.token || "");
      setCookie("is_superuser", data.is_superuser ? "true" : "false");

      const displayName = data.first_name || username;
      toast.success(`Welcome back, ${displayName}!`);

      try {
        const userId = data.user_id || data.userId || data.user || null;
        if (userId) {
          const profileRes = await fetch(
            `${API_URL}/api/user/admins/${userId}/`,
            {
              headers: { Authorization: `Token ${data.token}` },
            },
          );

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const src = profileData.data || {};

            sessionStorage.setItem(
              "user_info",
              JSON.stringify({
                first_name: src.first_name,
                last_name: src.last_name,
                email: src.email,
              }),
            );
          }
        }
      } catch (err) {
        console.warn("Profile error:", err);
      }

      if (data.is_superuser) {
        const [resRest, resBranch] = await Promise.all([
          fetch(`${API_URL}/api/restaurants/`, {
            headers: { Authorization: `Token ${data.token}` },
          }),
          fetch(`${API_URL}/api/branches/`, {
            headers: { Authorization: `Token ${data.token}` },
          }),
        ]);

        const restData = await resRest.json();
        const branchData = await resBranch.json();

        sessionStorage.setItem(
          "restaurants",
          JSON.stringify(restData.data || []),
        );
        sessionStorage.setItem(
          "branches",
          JSON.stringify(branchData.data || []),
        );

        setTimeout(() => router.push("/dashboard/restaurant"), 1000);
      } else {
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection Error!");
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <>
      <div className="min-h-screen flex bg-white font-sans">
        <ToastProvider />

        <div className="hidden lg:flex w-1/2 bg-[#1C4D21] relative overflow-hidden flex-col justify-between p-12">
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-green-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12 text-white/90">
              <ShieldCheck size={32} className="text-green-400" />
              <span className="text-xl font-bold tracking-widest uppercase">
                Admin
              </span>
            </div>

            <div className="mt-20">
              <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
                Welcome Back to <br />
                <span className="text-green-400">Control Center.</span>
              </h1>
              <p className="text-green-100/70 text-lg max-w-md leading-relaxed">
                Manage your orders, menu, and branches with our high-performance
                administrative suite. Secure, fast, and easy to use.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-sm text-green-200/50">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span className=" text-sm">
              © {new Date().getFullYear()} Sajha Infotech
            </span>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 md:p-20 bg-gray-50/50">
          <div className="w-full max-w-[420px]">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="bg-[#1C4D21] p-3 rounded-xl">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-500 font-medium">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-1 mb-4 text-black">
                <ShieldCheck size={25} className="text-green-400" />
                <span className="text-sm font-bold tracking-widest uppercase">
                  Admin Access
                </span>
              </div>
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21] transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#1C4D21] focus:ring-4 focus:ring-[#1C4D21]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Password <span className="text-red-400">*</span>
                </label>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1C4D21] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    maxLength={30}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#1C4D21] focus:ring-4 focus:ring-[#1C4D21]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <span className="text-xs text-[#1C4D21] font-semibold cursor-pointer hover:underline transition-all">
                    Forgot password?
                  </span>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1C4D21] hover:bg-[#143918] text-white py-4 rounded-xl font-bold text-[16px] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-xl shadow-green-900/10 mt-8 cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              Having trouble logging in?{" "}
              <span className="text-[#1C4D21] font-bold cursor-pointer underline">
                Contact Support
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
