"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/cookies";

/**
 * Entry redirect.
 *
 * This checked localStorage.getItem("adminToken"), but the token is stored in a
 * cookie — so the check never matched and a signed-in user was always bounced to
 * the login screen (which then bounced them back to /dashboard).
 */
export default function Main() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getCookie("adminToken") ? "/dashboard" : "/auth/login");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50">
      <div className="size-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  );
}
