"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: call backend API
    console.log("Admin Login:", { email, password });
    alert("Admin Login Successful (Mock) ✅");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-amber-800 text-center">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-500 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-amber-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
