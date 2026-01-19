"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Store,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  Circle,
  Activity,
  Calendar,
  Briefcase,
  Users,
} from "lucide-react";

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function Profile() {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);

  const [profile, setProfile] = useState({
    username: "-",
    first_name: "-",
    last_name: "-",
    email: "-",
    mobile_number: "-",
    restaurant_name: "N/A",
    branch_name: "N/A",
  });

  useEffect(() => {
    const token = getCookie("adminToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/me/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();

        setProfile({
          username: data.username || "-",
          first_name: data.first_name || "-",
          last_name: data.last_name || "-",
          email: data.email || "-",
          mobile_number: data.mobile_number || "-",
          restaurant_name: data.restaurant_name || "N/A",
          branch_name: data.branch_name || "N/A",
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  return (
    // Background changed to #ddf4e2
    <div className="min-h-screen bg-[#ddf4e2] font-sans">
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 max-w-7xl mx-auto">
        <div className="relative mb-8">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-[#236B28]/10 shadow-xl shadow-[#236B28]/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#236B28] p-1 shadow-lg shadow-[#236B28]/20">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ddf4e2] flex items-center justify-center">
                      <User size={40} className="text-[#236B28]" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#236B28] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Admin
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#236B28]">
                    {profile.username}
                  </h1>
                  <ShieldCheck className="text-[#236B28]" size={24} />
                </div>
                <p className="text-gray-600 mb-3 font-medium">
                  Welcome back to your administrative dashboard
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#236B28]/10 text-[#236B28] text-sm font-semibold">
                    <Store size={14} /> {profile.restaurant_name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#236B28]/10 text-[#236B28] text-sm font-semibold">
                    <Building2 size={14} /> {profile.branch_name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                    <Circle size={10} fill="currentColor" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Restaurant", val: profile.restaurant_name, Icon: Store },
            { title: "Branch", val: profile.branch_name, Icon: Building2 },
            {
              title: "Role",
              val: "Admin",
              Icon: ShieldCheck,
              sub: "Full Access",
            },
            {
              title: "Status",
              val: "Online",
              Icon: Activity,
              sub: "Last login: Today",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-md border border-[#236B28]/5 hover:shadow-lg transition-all border-b-4 border-b-[#236B28]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#ddf4e2] flex items-center justify-center mb-4">
                <item.Icon className="text-[#236B28]" size={24} />
              </div>
              <h3 className="font-bold text-[#236B28] mb-1">{item.title}</h3>
              <p className="text-gray-700 text-sm font-medium truncate">
                {item.val}
              </p>
              {item.sub && (
                <p className="text-gray-400 text-xs mt-1">{item.sub}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Info Sections */}
          {[
            {
              title: "Personal Information",
              Icon: User,
              items: [
                {
                  label: "Full Name",
                  val: `${profile.first_name} ${profile.last_name}`,
                  subIcon: User,
                },
                { label: "Email Address", val: profile.email, subIcon: Mail },
                {
                  label: "Mobile Number",
                  val: profile.mobile_number,
                  subIcon: Phone,
                },
                {
                  label: "Member Since",
                  val: "January 2024",
                  subIcon: Calendar,
                },
              ],
            },
            {
              title: "Professional Information",
              Icon: Briefcase,
              items: [
                {
                  label: "Restaurant",
                  val: profile.restaurant_name,
                  subIcon: Store,
                },
                {
                  label: "Branch",
                  val: profile.branch_name,
                  subIcon: Building2,
                },
                {
                  label: "Access Level",
                  val: "Administrator",
                  subIcon: ShieldCheck,
                  badge: "Full Access",
                },
                {
                  label: "Team Status",
                  val: "12 Active Members",
                  subIcon: Users,
                },
              ],
            },
          ].map((section, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-[#236B28]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#236B28] flex items-center justify-center shadow-md shadow-[#236B28]/20">
                  <section.Icon className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-4">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#ddf4e2]/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#ddf4e2] flex items-center justify-center">
                      <item.subIcon className="text-[#236B28]" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#236B28]/60 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{item.val}</p>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-[#236B28] text-white text-[10px] rounded-full font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Floating Calendar */}
        <div
          className="fixed bottom-6 right-6 z-50"
          onMouseEnter={() => setShowCalendar(true)}
          onMouseLeave={() => setShowCalendar(false)}
        >
          <button className="w-14 h-14 rounded-full bg-[#236B28] shadow-xl hover:shadow-[#236B28]/30 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-default">
            <Calendar className="text-white" size={24} />
          </button>

          {showCalendar && (
            <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="font-bold text-[#236B28]">Today's Date</h3>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-bold text-[#236B28]/40"
                  >
                    {d}
                  </div>
                ))}
                {Array.from({ length: 31 }, (_, i) => (
                  <div
                    key={i}
                    className={`text-center text-sm py-1 rounded font-medium ${
                      i + 1 === new Date().getDate()
                        ? "bg-[#236B28] text-white"
                        : "text-gray-600 hover:bg-[#ddf4e2]"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
