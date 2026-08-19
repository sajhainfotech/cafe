"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Clock,
  Package,
  ShoppingBag,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import PageShell from "@/components/ui/PageShell";
import { Select } from "@/components/ui/Field";
import { SectionLabel, StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ChartPanel, { ChartTooltip } from "./ChartPanel";
import { authHeader, getAuthToken } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 30000;

const PERIODS = [
  { value: "daily", label: "Today", tile: "today" },
  { value: "yesterday", label: "Yesterday", tile: "yesterday" },
  { value: "weekly", label: "This week", tile: "this week" },
  { value: "monthly", label: "This month", tile: "this month" },
  { value: "yearly", label: "This year", tile: "this year" },
];

/* Single-series charts, so one brand hue each — no categorical palette and
   therefore no series-identity problem to solve. */
const REVENUE_HUE = "#236b28"; // brand-600
const ORDERS_HUE = "#358c42"; // brand-500
const GRID = "#e2e6e3"; // ink-200
const AXIS_TEXT = "#6b766f"; // ink-500

const rupees = (n) => `Rs ${Number(n ?? 0).toLocaleString()}`;
const compactRupees = (n) =>
  n >= 1000 ? `Rs ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `Rs ${n}`;

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [nepalTime, setNepalTime] = useState(null);

  useEffect(() => {
    const tick = () =>
      setNepalTime(
        new Date(
          new Date(new Date().toUTCString().slice(0, -4)).getTime() +
            5.75 * 60 * 60 * 1000,
        ),
      );
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user_info");
      if (stored) {
        const user = JSON.parse(stored);
        setUsername(user.first_name || user.username || "Admin");
      }
    } catch {
      setUsername("Admin");
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/auth/login");
      return;
    }

    const fetchStats = async () => {
      try {
        // add slash after api_url
        const res = await fetch(
          `${API_URL}/api/dashboard-stats/?period=${period}`,
          { headers: authHeader() },
        );
        if (!res.ok) throw new Error("Failed to fetch stats");

        const result = await res.json();
        if (result.response_code === "0") {
          setStats(result.data);
        } else {
          console.warn("Stats API error:", result.response, result.errors);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    // No hasFetched guard: the effect is keyed on `period`, so changing the
    // dropdown has to refetch. The guard existed to stop a double fetch on
    // mount, which the dependency array already prevents.
    setLoading(true);
    fetchStats();

    const interval = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [router, period]);

  const greeting = (() => {
    if (!nepalTime) return "Welcome";
    const hour = nepalTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  /*
   * Prefer the period-scoped keys, fall back to the legacy ones.
   *
   * The API emits both so an older frontend keeps working; reading both here
   * means this page also survives being deployed before the backend, which is
   * exactly the version skew that broke status changes earlier.
   */
  const periodLabel =
    PERIODS.find((p) => p.value === period)?.tile ?? "this period";
  const series = stats?.series ?? stats?.weekly ?? [];
  const hasSeries = series.length > 0;
  const pick = (scoped, legacy) => stats?.[scoped] ?? stats?.[legacy] ?? 0;
  const pendingCount = pick("period_pending_orders", "today_pending_orders");

  const periodTiles = [
    {
      label: `Orders ${periodLabel}`,
      value: pick("period_orders", "today_orders"),
      icon: Package,
      tone: "brand",
    },
    {
      label: `Items sold ${periodLabel}`,
      value: pick("period_items_sold", "today_items_sold"),
      icon: Tag,
      tone: "info",
    },
    {
      label: `Revenue ${periodLabel}`,
      value: rupees(pick("period_revenue", "today_revenue")),
      icon: Wallet,
      tone: "success",
    },
    {
      label: "Pending now",
      value: pendingCount,
      icon: Clock,
      tone: pendingCount > 0 ? "warning" : "brand",
      hint:
        pendingCount > 0 ? "Needs attention in the kitchen" : "All caught up",
    },
  ];

  const lifetimeTiles = [
    {
      label: "Total orders",
      value: stats?.total_orders ?? 0,
      icon: ShoppingBag,
      tone: "brand",
    },
    {
      label: "Total revenue",
      value: rupees(stats?.total_revenue),
      icon: Wallet,
      tone: "success",
    },
    {
      label: "Total items sold",
      value: stats?.total_items_sold ?? 0,
      icon: TrendingUp,
      tone: "info",
    },
  ];

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">
            {greeting}
            {username && `, ${username}`}
          </h1>
          <p className="mt-0.5 text-xs text-ink-500">
            {nepalTime
              ? nepalTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : " "}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {nepalTime && (
            <span className="hidden text-sm font-semibold tabular-nums text-ink-600 sm:inline">
              {nepalTime.toTimeString().slice(0, 8)}
            </span>
          )}
          <Badge tone="success" dot>
            Live
          </Badge>
          {/* Drives both the tiles and the chart, so the two can never show
              different windows. */}
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Reporting period"
            className="w-36"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <section className="space-y-3">
        <SectionLabel>
          {PERIODS.find((p) => p.value === period)?.label ?? "Today"}
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {periodTiles.map((tile) => (
            <StatCard key={tile.label} loading={loading} {...tile} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>All time</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {lifetimeTiles.map((tile) => (
            <StatCard key={tile.label} loading={loading} {...tile} />
          ))}
        </div>
      </section>

      {/* Two single-axis panels. This was one dual-axis chart with revenue on a
          left scale and items-sold on a right scale, which makes the two lines'
          crossings meaningless — plus a Revenue/Units toggle wired to nothing. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Revenue"
          subtitle={stats?.series_label ?? "Last 7 days"}
          hasData={hasSeries}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={REVENUE_HUE}
                    stopOpacity={0.18}
                  />
                  <stop offset="100%" stopColor={REVENUE_HUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={GRID}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                tickFormatter={compactRupees}
                width={58}
              />
              <Tooltip
                cursor={{ stroke: GRID, strokeWidth: 1 }}
                content={
                  <ChartTooltip
                    rows={[
                      { key: "revenue", label: "Revenue", format: rupees },
                      { key: "itemsSold", label: "Items sold" },
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={REVENUE_HUE}
                strokeWidth={2}
                fill="url(#revenueFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Orders"
          subtitle={stats?.series_label ?? "Last 7 days"}
          hasData={hasSeries}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                stroke={GRID}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "rgba(35,107,40,0.06)" }}
                content={
                  <ChartTooltip
                    rows={[
                      { key: "ordersCount", label: "Orders" },
                      { key: "itemsSold", label: "Items sold" },
                    ]}
                  />
                }
              />
              <Bar
                dataKey="ordersCount"
                fill={ORDERS_HUE}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </PageShell>
  );
}
