"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import SearchSelect from "@/components/ui/SearchSelect";
import { authHeader, getAuthToken } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_FORM = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  mobile_number: "",
  address: "",
  restaurant: "",
  branch: "",
};

/**
 * Staff account form. Used two ways:
 *   - inside the Users page dialog (gets closeModal + refreshAdmins)
 *   - as the standalone /auth/register route
 *
 * It no longer renders its own fixed overlay: when embedded it sat inside the
 * Users dialog, so there were two stacked backdrops and two close buttons.
 */
export default function AdminRegisterPage({
  adminData = null,
  admins = [],
  restaurants: restaurantsProp,
  branches: branchesProp,
  refreshAdmins,
  closeModal,
}) {
  const router = useRouter();
  const isEditing = Boolean(adminData?.reference_id);

  const [restaurants, setRestaurants] = useState(restaurantsProp ?? []);
  const [branches, setBranches] = useState(branchesProp ?? []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tracks the restaurant we last reacted to, so we only clear the branch on a
  // genuine user-driven change — not when adminData first populates the form.
  const lastRestaurant = useRef(null);

  useEffect(() => {
    if (restaurantsProp?.length) setRestaurants(restaurantsProp);
  }, [restaurantsProp]);

  useEffect(() => {
    if (branchesProp?.length) setBranches(branchesProp);
  }, [branchesProp]);

  // Only fetch what the parent didn't already hand us.
  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Please sign in again");
      return;
    }

    const load = async (path, setter, label) => {
      try {
        const res = await fetch(`${API_URL}${path}`, { headers: authHeader() });
        const data = await res.json();
        setter(data.data?.results || data.data || []);
      } catch {
        toast.error(`Failed to load ${label}`);
      }
    };

    if (!restaurantsProp?.length)
      load("/api/restaurants/", setRestaurants, "restaurants");
    if (!branchesProp?.length) load("/api/branches/", setBranches, "branches");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!adminData) {
      setForm(EMPTY_FORM);
      lastRestaurant.current = null;
      return;
    }

    const restaurantId =
      adminData.restaurant?.reference_id ??
      adminData.restaurant_reference_id ??
      adminData.restaurant ??
      "";
    const branchId =
      adminData.branch?.reference_id ??
      adminData.branch_reference_id ??
      adminData.branch ??
      "";

    setForm({
      username: adminData.username || "",
      password: "",
      first_name: adminData.first_name || "",
      last_name: adminData.last_name || "",
      email: adminData.email || "",
      mobile_number: adminData.mobile_number || "",
      address: adminData.address || "",
      restaurant: restaurantId,
      branch: branchId,
    });
    lastRestaurant.current = restaurantId;
  }, [adminData]);

  const branchOptions = useMemo(() => {
    if (!form.restaurant) return [];
    return branches
      .filter((b) => b.restaurant_reference_id === form.restaurant)
      .map((b) => ({ value: b.reference_id, label: b.name }));
  }, [branches, form.restaurant]);

  const restaurantOptions = useMemo(
    () => restaurants.map((r) => ({ value: r.reference_id, label: r.name })),
    [restaurants],
  );

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const changeRestaurant = (value) => {
    setForm((prev) => ({
      ...prev,
      restaurant: value,
      // Clearing the branch is right here — the old branch belongs to a
      // different restaurant — but the old code did this on every render pass.
      branch: value === lastRestaurant.current ? prev.branch : "",
    }));
    lastRestaurant.current = value;
    setErrors((prev) => ({ ...prev, restaurant: "", branch: "" }));
  };

  const validate = () => {
    const next = {};
    const taken = (field, value) =>
      admins.some(
        (a) =>
          String(a[field] ?? "").toLowerCase() === value.toLowerCase() &&
          a.reference_id !== adminData?.reference_id,
      );

    const username = form.username.trim();
    if (!username) next.username = "Username is required";
    else if (username.length < 3)
      next.username = "Username must be at least 3 characters";
    else if (username.length > 50)
      next.username = "Username must be under 50 characters";
    else if (taken("username", username))
      next.username = "That username is taken";

    if (!form.first_name.trim()) next.first_name = "First name is required";
    else if (form.first_name.trim().length < 2)
      next.first_name = "At least 2 characters";

    if (!form.last_name.trim()) next.last_name = "Last name is required";
    else if (form.last_name.trim().length < 2)
      next.last_name = "At least 2 characters";

    const email = form.email.trim();
    if (!email) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";
    else if (taken("email", email)) next.email = "That email is already in use";

    const mobile = form.mobile_number.trim();
    if (!mobile) next.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(mobile))
      next.mobile_number = "Enter a 10-digit mobile number";
    else if (taken("mobile_number", mobile))
      next.mobile_number = "That number is already in use";

    if (!form.address.trim()) next.address = "Address is required";
    else if (form.address.trim().length < 5)
      next.address = "At least 5 characters";

    if (!isEditing) {
      if (!form.password || form.password.length < 6)
        next.password = "Password must be at least 6 characters";
    } else if (form.password && form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    if (!form.restaurant) next.restaurant = "Choose a restaurant";
    if (form.restaurant && !form.branch) next.branch = "Choose a branch";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Check the highlighted fields");
      return;
    }
    if (!getAuthToken()) {
      toast.error("Please sign in again");
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
      if (form.password) payload.password = form.password;

      const res = await fetch(
        isEditing
          ? `${API_URL}/api/user/admins/${adminData.reference_id}/`
          : `${API_URL}/api/user/admins/`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.response || "Failed to save this account");
        return;
      }

      toast.success(isEditing ? "Account updated" : "Account created");
      refreshAdmins?.();
      closeModal?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const digitsOnly = (e) =>
    setField("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10));

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.first_name}>
          {(props) => (
            <Input
              {...props}
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              placeholder="Anish"
            />
          )}
        </Field>

        <Field label="Last name" required error={errors.last_name}>
          {(props) => (
            <Input
              {...props}
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
              placeholder="Bista"
            />
          )}
        </Field>

        <Field label="Username" required error={errors.username}>
          {(props) => (
            <Input
              {...props}
              autoComplete="off"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="anish.b"
            />
          )}
        </Field>

        <Field
          label={isEditing ? "New password" : "Password"}
          required={!isEditing}
          error={errors.password}
          hint={isEditing ? "Leave blank to keep the current password." : undefined}
        >
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="At least 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 transition-colors hover:text-ink-700 cursor-pointer"
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

        <Field label="Email" required error={errors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="name@example.com"
            />
          )}
        </Field>

        <Field
          label="Mobile number"
          required
          error={errors.mobile_number}
          hint={
            form.mobile_number
              ? `${form.mobile_number.length}/10 digits`
              : undefined
          }
        >
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              maxLength={10}
              value={form.mobile_number}
              onChange={digitsOnly}
              placeholder="98XXXXXXXX"
            />
          )}
        </Field>
      </div>

      <Field label="Address" required error={errors.address}>
        {(props) => (
          <Input
            {...props}
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Street, city"
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Restaurant" required error={errors.restaurant}>
          {({ invalid, ...props }) => (
            <SearchSelect
              {...props}
              invalid={invalid}
              value={form.restaurant}
              onChange={changeRestaurant}
              options={restaurantOptions}
              placeholder="Choose a restaurant"
            />
          )}
        </Field>

        <Field
          label="Branch"
          required
          error={errors.branch}
          hint={
            !form.restaurant
              ? "Pick a restaurant first."
              : branchOptions.length === 0
                ? "This restaurant has no branches yet."
                : undefined
          }
        >
          {({ invalid, ...props }) => (
            <SearchSelect
              {...props}
              invalid={invalid}
              value={form.branch}
              onChange={(value) => setField("branch", value)}
              options={branchOptions}
              disabled={!form.restaurant || branchOptions.length === 0}
              placeholder="Choose a branch"
              emptyMessage="No branches for this restaurant"
            />
          )}
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-200 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (closeModal ? closeModal() : router.back())}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          {isEditing ? "Update account" : "Create account"}
        </Button>
      </div>
    </form>
  );

  // Embedded in the Users dialog, the dialog already provides the card.
  if (closeModal) return formBody;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-ink-200 bg-white p-6 shadow-card">
        <h1 className="text-lg font-bold tracking-tight text-ink-900">
          Create a staff account
        </h1>
        <p className="mb-5 mt-0.5 text-xs text-ink-500">
          The account will be scoped to one restaurant and branch.
        </p>
        {formBody}
      </div>
    </div>
  );
}
