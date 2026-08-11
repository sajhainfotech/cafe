"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  User,
  UserCircle2,
} from "lucide-react";

import PageShell from "@/components/ui/PageShell";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { authHeader, getAuthToken, getCookie } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Read-only account summary.
 *
 * Everything shown here comes from /api/user/me/. The previous version also
 * displayed "Member since January 2024", "12 Active Members", "Last login:
 * Today" and a calendar that rendered days 1–31 for every month — all
 * hardcoded, none of it backed by the API. Invented values in an admin panel
 * are worse than absent ones, so they're gone rather than faked.
 */
export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSuperUser = getCookie("is_superuser") === "true";

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/auth/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/me/`, {
          headers: authHeader(),
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        setProfile(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const value = (v) => (v && v !== "" ? v : null);
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null;

  const accountRows = [
    { label: "Full name", value: fullName, icon: User },
    { label: "Username", value: value(profile?.username), icon: UserCircle2 },
    { label: "Email", value: value(profile?.email), icon: Mail },
    { label: "Mobile", value: value(profile?.mobile_number), icon: Phone },
  ];

  const placementRows = [
    { label: "Restaurant", value: value(profile?.restaurant_name), icon: Store },
    { label: "Branch", value: value(profile?.branch_name), icon: Building2 },
    {
      label: "Access level",
      value: isSuperUser ? "Super admin" : "Staff",
      icon: ShieldCheck,
    },
  ];

  return (
    <PageShell className="max-w-4xl">
      <Card>
        <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-600 text-xl font-bold text-white">
            {loading
              ? ""
              : (fullName || profile?.username || "?").charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            ) : (
              <>
                <h1 className="truncate text-lg font-bold tracking-tight text-ink-900">
                  {fullName || profile?.username || "Your account"}
                </h1>
                {profile?.username && (
                  <p className="text-xs text-ink-500">@{profile.username}</p>
                )}
              </>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={isSuperUser ? "brand" : "neutral"}>
                {isSuperUser ? "Super admin" : "Staff"}
              </Badge>
              {profile?.restaurant_name && (
                <Badge tone="neutral">{profile.restaurant_name}</Badge>
              )}
              {profile?.branch_name && (
                <Badge tone="neutral">{profile.branch_name}</Badge>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account details" />
          <DetailList rows={accountRows} loading={loading} />
        </Card>

        <Card>
          <CardHeader title="Placement" />
          <DetailList rows={placementRows} loading={loading} />
        </Card>
      </div>

      <p className="text-2xs text-ink-500">
        Need something here changed? Ask a super admin to update your account.
      </p>
    </PageShell>
  );
}

function DetailList({ rows, loading }) {
  return (
    <dl className="divide-y divide-ink-100">
      {rows.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 px-5 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-100">
            <Icon className="size-4 text-ink-500" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
              {label}
            </dt>
            <dd className="truncate text-sm font-medium text-ink-900">
              {loading ? (
                <Skeleton className="mt-1 h-3.5 w-32" />
              ) : (
                (value ?? <span className="text-ink-400">Not set</span>)
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
