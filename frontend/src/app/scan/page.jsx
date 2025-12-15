"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";

export default function ScanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tableNumber = searchParams.get("table_number");

    console.log("📲 Scanned table_number:", tableNumber);

    if (!tableNumber) {
      toast.error("Invalid QR Code");
      return;
    }

    // ✅ table_number save
    localStorage.setItem("table_number", tableNumber);

    toast.success(`Table ${tableNumber} selected`);

    setTimeout(() => {
      router.push("/customer");
    }, 1000);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <ToastProvider />
      <div className="bg-white p-6 rounded shadow text-center">
        <h1 className="text-2xl font-bold text-amber-600">
          Scanning Table...
        </h1>
        <p className="text-gray-600 mt-2">
          Please wait
        </p>
      </div>
    </div>
  );
}
