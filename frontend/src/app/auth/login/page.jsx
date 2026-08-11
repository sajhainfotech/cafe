"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";

import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { getCookie, setCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (getCookie("adminToken")) {
      router.replace("/dashboard");
      return;
    }
    sessionStorage.clear();
  }, [router]);

  const validate = () => {
    const next = {};
    if (!username.trim()) next.username = "Username is required";
    else if (username.length < 3)
      next.username = "Username must be at least 3 characters";

    if (!password) next.password = "Password is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${username}:${password}`),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.response || "Incorrect username or password");
        return;
      }

      if (!data?.is_staff) {
        toast.error("This account can't access the admin panel");
        return;
      }

      setCookie("adminToken", data.token || "");
      setCookie("is_superuser", data.is_superuser ? "true" : "false");

      const userInfo = {
        user_id: data.user_id || "",
        first_name: data.first_name || username,
        last_name: data.last_name || "",
        email: data.email || "",
        is_staff: Boolean(data.is_staff),
        is_superuser: Boolean(data.is_superuser),
        restaurant_name: data.restaurant_name || "",
        branch_name: data.branch_name || "",
      };
      sessionStorage.setItem("user_info", JSON.stringify(userInfo));

      if (data.restaurant_name)
        sessionStorage.setItem("restaurant_name", data.restaurant_name);
      if (data.branch_name)
        sessionStorage.setItem("branch_name", data.branch_name);

      // Enrich the cached profile; failure here must not block sign-in.
      const userId = data.user_id || data.userId || data.user || null;
      if (userId) {
        try {
          const profileRes = await fetch(
            `${API_URL}/api/user/admins/${userId}/`,
            { headers: { Authorization: `Token ${data.token}` } },
          );
          if (profileRes.ok) {
            const src = (await profileRes.json()).data || {};
            sessionStorage.setItem(
              "user_info",
              JSON.stringify({
                ...userInfo,
                first_name: src.first_name || userInfo.first_name,
                last_name: src.last_name || "",
                email: src.email || userInfo.email,
                mobile_number: src.mobile_number || "",
                address: src.address || "",
              }),
            );
          }
        } catch (err) {
          console.warn("Profile fetch failed:", err);
        }
      }

      if (data.is_superuser) {
        try {
          const [restRes, branchRes] = await Promise.all([
            fetch(`${API_URL}/api/restaurants/`, {
              headers: { Authorization: `Token ${data.token}` },
            }),
            fetch(`${API_URL}/api/branches/`, {
              headers: { Authorization: `Token ${data.token}` },
            }),
          ]);
          sessionStorage.setItem(
            "restaurants",
            JSON.stringify((await restRes.json()).data || []),
          );
          sessionStorage.setItem(
            "branches",
            JSON.stringify((await branchRes.json()).data || []),
          );
        } catch (err) {
          console.warn("Restaurant/branch prefetch failed:", err);
        }
      } else {
        sessionStorage.setItem(
          "restaurants",
          JSON.stringify({
            results: [
              {
                reference_id: data.restaurant_id,
                name: data.restaurant_name,
                address: data.restaurant_address || "",
              },
            ],
          }),
        );
        sessionStorage.setItem(
          "branches",
          JSON.stringify({
            results: [
              {
                reference_id: data.branch_id,
                name: data.branch_name,
                address: data.branch_address || "",
                restaurant_reference_id: data.restaurant_id,
              },
            ],
          }),
        );
      }

      toast.success(`Welcome back, ${data.first_name || username}`);
      // Previously every one of these was wrapped in a 1s setTimeout (and
      // /dashboard was pushed twice), which made a fast login feel slow.
      router.replace(data.is_superuser ? "/dashboard/restaurant" : "/dashboard");
    } catch {
      toast.error("Can't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field, setter) => (e) => {
    setter(e.target.value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="flex min-h-dvh bg-white">
      {/* Brand panel — decorative, so it's hidden rather than stacked on mobile. */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-800 p-12 lg:flex">
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 size-96 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 size-80 rounded-full bg-brand-400/10 blur-3xl"
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-brand-600">
            <UtensilsCrossed className="size-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-white">
            Cafe Admin
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Run the floor from
            <br />
            <span className="text-brand-300">one screen.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100/80">
            Live orders, menu, tables and daily sales — all in one place.
          </p>
        </div>

        <p className="relative z-10 text-2xs text-brand-200/60">
          © {new Date().getFullYear()} Sajha Infotech
        </p>
      </aside>

      <main className="flex w-full flex-col items-center justify-center bg-ink-50 p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-96">
          <div className="mb-8 flex flex-col items-center lg:items-start">
            <div className="mb-5 grid size-11 place-items-center rounded-xl bg-brand-600 lg:hidden">
              <UtensilsCrossed className="size-6 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Use your staff account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Username" required error={errors.username}>
              {(props) => (
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                    aria-hidden="true"
                  />
                  <Input
                    {...props}
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={update("username", setUsername)}
                    placeholder="Your username"
                    className="h-11 pl-9"
                  />
                </div>
              )}
            </Field>

            <Field label="Password" required error={errors.password}>
              {(props) => (
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                    aria-hidden="true"
                  />
                  <Input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={update("password", setPassword)}
                    placeholder="Your password"
                    className="h-11 pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5",
                      "text-ink-400 transition-colors hover:text-ink-700 cursor-pointer",
                    )}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </Field>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="mt-2 w-full"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* The previous page showed "Forgot password?" and "Contact Support"
              styled as links, but neither was wired to anything. Dropped rather
              than shipped as dead affordances. */}
          <p className="mt-8 text-center text-2xs text-ink-500 lg:text-left">
            Trouble signing in? Ask your super admin to reset your account.
          </p>
        </div>
      </main>
    </div>
  );
}
