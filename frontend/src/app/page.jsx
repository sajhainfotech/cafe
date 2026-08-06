"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Main() {
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");

    if (adminToken) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [router]);

  return null;
}
